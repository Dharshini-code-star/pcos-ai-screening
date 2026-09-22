"""Train the PCOS screening risk model.

Candidates: Logistic Regression (fully linear/interpretable baseline) and
Gradient Boosting (usually stronger on this kind of tabular data). Whichever
wins cross-validated AUROC is calibrated (Platt/sigmoid — the dataset is too
small for isotonic to be stable) and paired with a matching SHAP explainer.

A separate IsolationForest is fit on the raw feature matrix as a novelty/OOD
detector: it backs the API's `is_insufficient_data` flag for inputs that look
nothing like anything in training data (see services/ml/app/inference.py).

Run: `python scripts/train.py` after `python scripts/prepare_dataset.py`.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import GradientBoostingClassifier, IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_predict, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV

ML_DIR = Path(__file__).resolve().parent.parent
DATA_CSV = ML_DIR / "data" / "prepared.csv"
ARTIFACTS_DIR = ML_DIR / "artifacts"
SCHEMA_PATH = ML_DIR / "app" / "feature_schema.json"

RANDOM_STATE = 42


def build_pipeline(estimator) -> Pipeline:
    # Median imputation covers the one missing period_duration_days row (and
    # any missing optional symptom fields at inference time); tree/linear
    # models here don't need scaling to perform well on this feature set.
    return Pipeline([
        ("impute", SimpleImputer(strategy="median")),
        ("clf", estimator),
    ])


def evaluate(name: str, pipeline: Pipeline, X: pd.DataFrame, y: pd.Series) -> dict:
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    proba = cross_val_predict(pipeline, X, y, cv=cv, method="predict_proba")[:, 1]
    auroc = roc_auc_score(y, proba)
    acc = accuracy_score(y, proba >= 0.5)
    brier = brier_score_loss(y, proba)
    print(f"[{name}] CV AUROC={auroc:.3f} accuracy={acc:.3f} brier={brier:.3f}")
    return {"name": name, "auroc": auroc, "accuracy": acc, "brier": brier}


def main() -> None:
    df = pd.read_csv(DATA_CSV)
    feature_cols = [c for c in df.columns if c != "pcos"]
    X = df[feature_cols]
    y = df["pcos"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )

    candidates = {
        "logistic_regression": build_pipeline(
            LogisticRegression(max_iter=2000, class_weight="balanced", random_state=RANDOM_STATE)
        ),
        "gradient_boosting": build_pipeline(
            GradientBoostingClassifier(random_state=RANDOM_STATE)
        ),
    }

    results = [evaluate(name, pipe, X_train, y_train) for name, pipe in candidates.items()]
    best_name = max(results, key=lambda r: r["auroc"])["name"]
    best_pipeline = candidates[best_name]
    print(f"Selected model: {best_name}")

    # Calibrate on the training split via internal CV, then evaluate once on
    # the held-out test split (never touched during selection/calibration).
    calibrated = CalibratedClassifierCV(best_pipeline, method="sigmoid", cv=5)
    calibrated.fit(X_train, y_train)

    test_proba = calibrated.predict_proba(X_test)[:, 1]
    test_auroc = roc_auc_score(y_test, test_proba)
    test_acc = accuracy_score(y_test, test_proba >= 0.5)
    test_brier = brier_score_loss(y_test, test_proba)
    test_cm = confusion_matrix(y_test, test_proba >= 0.5).tolist()
    print(f"[held-out test] AUROC={test_auroc:.3f} accuracy={test_acc:.3f} brier={test_brier:.3f}")
    print(f"[held-out test] confusion matrix (rows=actual, cols=predicted) = {test_cm}")

    # Refit the winning (uncalibrated) pipeline on ALL data for the SHAP
    # background/explainer and for the novelty detector's reference
    # distribution — calibration is a probability wrapper, not what SHAP
    # should explain against.
    best_pipeline.fit(X, y)
    imputer: SimpleImputer = best_pipeline.named_steps["impute"]
    clf = best_pipeline.named_steps["clf"]
    X_imputed = pd.DataFrame(imputer.transform(X), columns=feature_cols)

    # Refit calibration on the full dataset for the artifact we actually ship
    # (the held-out numbers above are what we report as real generalization).
    final_calibrated = CalibratedClassifierCV(best_pipeline, method="sigmoid", cv=5)
    final_calibrated.fit(X, y)

    if best_name == "gradient_boosting":
        explainer = shap.TreeExplainer(clf, X_imputed)
    else:
        explainer = shap.LinearExplainer(clf, X_imputed)

    novelty = IsolationForest(random_state=RANDOM_STATE, contamination=0.05)
    novelty.fit(X_imputed)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(final_calibrated, ARTIFACTS_DIR / "model.joblib")
    joblib.dump(imputer, ARTIFACTS_DIR / "imputer.joblib")
    joblib.dump(explainer, ARTIFACTS_DIR / "explainer.joblib")
    joblib.dump(novelty, ARTIFACTS_DIR / "novelty.joblib")
    joblib.dump(feature_cols, ARTIFACTS_DIR / "feature_columns.joblib")

    metadata = {
        "model_version": "v1",
        "selected_model": best_name,
        "feature_columns": feature_cols,
        "n_training_rows": int(len(df)),
        "class_balance": y.value_counts().to_dict(),
        "cv_results": results,
        "held_out_test": {
            "auroc": test_auroc,
            "accuracy": test_acc,
            "brier": test_brier,
            "confusion_matrix": test_cm,
            "n_test_rows": int(len(X_test)),
        },
        "limitations": (
            "Trained on a single public dataset of 541 women from ten hospitals "
            "in Kerala, India (Kottarathil PCOS dataset). Not clinically "
            "validated, not representative of all populations, and not a "
            "diagnostic device. See services/ml/README.md."
        ),
    }
    (ARTIFACTS_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2, default=str))
    print(f"Artifacts written to {ARTIFACTS_DIR}")


if __name__ == "__main__":
    main()
