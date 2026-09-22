from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from app.schema import AssessRequest, AssessResponse, ShapContribution

APP_DIR = Path(__file__).resolve().parent
ARTIFACTS_DIR = APP_DIR.parent / "artifacts"

DISCLAIMER = (
    "This is a risk screening estimate, not a medical diagnosis. PCOS can only "
    "be diagnosed by a clinician using the Rotterdam criteria (clinical, "
    "biochemical, and ultrasound assessment). Please discuss this result with "
    "a doctor, especially if your risk band is moderate or elevated."
)

# Novelty score normalization bounds, derived from IsolationForest.decision_function
# on the training set (see services/ml/scripts/train.py output) — training scores
# ranged roughly [-0.05, 0.20]. Inputs further outside that range clip to 0.
NOVELTY_LOW = -0.05
NOVELTY_HIGH = 0.20

# Below this confidence, the API reports is_insufficient_data instead of a
# headline number, regardless of what the raw prediction says.
CONFIDENCE_FLOOR = 0.4
COMPLETENESS_FLOOR = 0.25

RISK_BAND_THRESHOLDS = (0.3, 0.6)  # <0.3 low, <0.6 moderate, else elevated


class Model:
    def __init__(self) -> None:
        self.calibrated_model = joblib.load(ARTIFACTS_DIR / "model.joblib")
        self.imputer = joblib.load(ARTIFACTS_DIR / "imputer.joblib")
        self.explainer = joblib.load(ARTIFACTS_DIR / "explainer.joblib")
        self.novelty = joblib.load(ARTIFACTS_DIR / "novelty.joblib")
        self.feature_columns: list[str] = joblib.load(ARTIFACTS_DIR / "feature_columns.joblib")
        self.metadata = json.loads((ARTIFACTS_DIR / "metadata.json").read_text())
        self.schema = json.loads((APP_DIR / "feature_schema.json").read_text())

        self.optional_fields = [
            f["name"] for f in self.schema["features"] if not f["required"]
        ]
        self.field_labels = {f["name"]: f["label"] for f in self.schema["features"]}
        self.field_labels["bmi"] = "Body mass index (BMI)"

    def _request_to_row(self, req: AssessRequest) -> pd.DataFrame:
        bmi = req.weight_kg / ((req.height_cm / 100) ** 2)
        values = {
            "age": req.age,
            "bmi": bmi,
            "height_cm": req.height_cm,
            "weight_kg": req.weight_kg,
            "cycle_regularity": int(req.cycle_regularity),
            "period_duration_days": req.period_duration_days,
            "weight_gain": _bool_to_int(req.weight_gain),
            "hair_growth": _bool_to_int(req.hair_growth),
            "skin_darkening": _bool_to_int(req.skin_darkening),
            "hair_loss": _bool_to_int(req.hair_loss),
            "pimples": _bool_to_int(req.pimples),
            "fast_food": _bool_to_int(req.fast_food),
            "regular_exercise": _bool_to_int(req.regular_exercise),
        }
        return pd.DataFrame([[values[c] for c in self.feature_columns]], columns=self.feature_columns)

    def _missing_fields(self, req: AssessRequest) -> list[str]:
        data = req.model_dump()
        return [f for f in self.optional_fields if data.get(f) is None]

    def assess(self, req: AssessRequest) -> AssessResponse:
        row = self._request_to_row(req)
        risk_probability = float(self.calibrated_model.predict_proba(row)[0, 1])

        imputed_row = pd.DataFrame(
            self.imputer.transform(row), columns=self.feature_columns
        )

        missing = self._missing_fields(req)
        completeness = 1 - (len(missing) / len(self.optional_fields))

        novelty_raw = float(self.novelty.decision_function(imputed_row)[0])
        novelty_norm = _clip01((novelty_raw - NOVELTY_LOW) / (NOVELTY_HIGH - NOVELTY_LOW))

        confidence_score = _clip01(0.6 * completeness + 0.4 * novelty_norm)
        is_insufficient_data = (
            confidence_score < CONFIDENCE_FLOOR or completeness < COMPLETENESS_FLOOR
        )

        explanation = self.explainer(imputed_row)
        shap_row = np.asarray(explanation.values[0]).reshape(-1)
        base_value = float(np.asarray(explanation.base_values).reshape(-1)[0])

        missing_set = set(missing)
        contributions = []
        for feature, contribution in zip(self.feature_columns, shap_row):
            was_imputed = feature in missing_set
            contributions.append(
                ShapContribution(
                    feature=feature,
                    label=self.field_labels.get(feature, feature),
                    value=None if was_imputed else _display_value(feature, imputed_row.iloc[0][feature]),
                    is_imputed=was_imputed,
                    contribution=float(contribution),
                    direction="higher_risk" if contribution >= 0 else "lower_risk",
                )
            )
        contributions.sort(key=lambda c: abs(c.contribution), reverse=True)

        return AssessResponse(
            model_version=self.metadata["model_version"],
            risk_probability=risk_probability,
            risk_band=_risk_band(risk_probability),
            confidence_score=confidence_score,
            is_insufficient_data=is_insufficient_data,
            missing_fields=missing,
            shap_values=contributions,
            base_value=base_value,
            disclaimer=DISCLAIMER,
        )


def _bool_to_int(value: bool | None) -> float | None:
    if value is None:
        return None
    return int(value)


def _clip01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _risk_band(p: float) -> str:
    low, moderate = RISK_BAND_THRESHOLDS
    if p < low:
        return "low"
    if p < moderate:
        return "moderate"
    return "elevated"


def _display_value(feature: str, value: float):
    if feature in ("cycle_regularity",) or (
        feature not in ("age", "bmi", "height_cm", "weight_kg", "period_duration_days")
    ):
        return bool(round(value))
    return round(float(value), 1)


model = Model()
