"""Prepare the self-reportable PCOS screening dataset.

Source: the public "PCOS_data_without_infertility" dataset (Kottarathil, Kaggle),
541 clinical records (364 non-PCOS / 177 PCOS) collected from ten hospitals across
Kerala, India. See services/ml/README.md for the full provenance and limitations
note — this is a small, single-population dataset and is NOT clinically validated.

This script deliberately drops every lab/imaging-only column (hormone panels,
follicle counts on ultrasound, blood pressure, etc.). The product is a
self-screening questionnaire, not a diagnostic device, so the model must only
ever need answers a person can give without a blood draw or a scan.

Column-selection notes specific to this dataset:
  * BMI is recomputed from height/weight rather than trusting the sheet's `BMI`
    column, which is null for ~55% of rows.
  * `Cycle length(days)` ranges 0-12 in this sheet, which does not match a real
    menstrual *cycle* length (typically 21-35 days). Its distribution (mode 5,
    range 2-12) matches menstrual *bleeding/period duration* far better, so we
    treat and label it as period duration in days, not full cycle length. This
    is a documented quirk of this dataset, not a modeling choice we invented.
  * `Cycle(R/I)` is coded 2=regular, 4=irregular, with a single stray 5 in one
    row (treated as irregular alongside 4).
"""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SOURCE_XLSX = DATA_DIR / "PCOS_data_without_infertility.xlsx"
OUT_CSV = DATA_DIR / "prepared.csv"
SCHEMA_OUT = Path(__file__).resolve().parent.parent / "app" / "feature_schema.json"

RAW_COLUMNS = {
    "PCOS (Y/N)": "pcos",
    " Age (yrs)": "age",
    "Weight (Kg)": "weight_kg",
    "Height(Cm) ": "height_cm",
    "Cycle(R/I)": "cycle_regularity_raw",
    "Cycle length(days)": "period_duration_days",
    "Weight gain(Y/N)": "weight_gain",
    "hair growth(Y/N)": "hair_growth",
    "Skin darkening (Y/N)": "skin_darkening",
    "Hair loss(Y/N)": "hair_loss",
    "Pimples(Y/N)": "pimples",
    "Fast food (Y/N)": "fast_food",
    "Reg.Exercise(Y/N)": "regular_exercise",
}

BINARY_SYMPTOM_FEATURES = [
    "weight_gain",
    "hair_growth",
    "skin_darkening",
    "hair_loss",
    "pimples",
    "fast_food",
    "regular_exercise",
]

# Feature schema shared by the frontend questionnaire and the FastAPI request
# validator. `min`/`max` are the training data's observed range, used both for
# sane form limits and for the out-of-range component of the novelty check.
FEATURE_SCHEMA = {
    "model_version": "v1",
    "target": "pcos",
    "features": [
        {
            "name": "age",
            "label": "Age",
            "type": "number",
            "unit": "years",
            "min": 15,
            "max": 55,
            "required": True,
            "help": "Your current age in years.",
        },
        {
            "name": "height_cm",
            "label": "Height",
            "type": "number",
            "unit": "cm",
            "min": 120,
            "max": 210,
            "required": True,
            "help": "Used with weight to calculate BMI.",
        },
        {
            "name": "weight_kg",
            "label": "Weight",
            "type": "number",
            "unit": "kg",
            "min": 30,
            "max": 150,
            "required": True,
            "help": "Used with height to calculate BMI.",
        },
        {
            "name": "cycle_regularity",
            "label": "Menstrual cycle regularity",
            "type": "boolean",
            "true_label": "Irregular",
            "false_label": "Regular",
            "required": True,
            "help": "Regular means your period arrives roughly the same number of days apart, cycle after cycle.",
        },
        {
            "name": "period_duration_days",
            "label": "Period duration",
            "type": "number",
            "unit": "days",
            "min": 1,
            "max": 12,
            "required": False,
            "help": "How many days you typically bleed for, not the gap between periods.",
        },
        {
            "name": "weight_gain",
            "label": "Recent unexplained weight gain",
            "type": "boolean",
            "required": False,
        },
        {
            "name": "hair_growth",
            "label": "Excess hair growth (face/chest/back)",
            "type": "boolean",
            "required": False,
        },
        {
            "name": "skin_darkening",
            "label": "Skin darkening (neck, underarms, groin)",
            "type": "boolean",
            "required": False,
        },
        {
            "name": "hair_loss",
            "label": "Hair thinning or hair loss",
            "type": "boolean",
            "required": False,
        },
        {
            "name": "pimples",
            "label": "Persistent acne/pimples",
            "type": "boolean",
            "required": False,
        },
        {
            "name": "fast_food",
            "label": "Frequent fast food consumption",
            "type": "boolean",
            "required": False,
        },
        {
            "name": "regular_exercise",
            "label": "Regular exercise",
            "type": "boolean",
            "required": False,
        },
    ],
    # required for a "reliable" read; below this the API returns is_insufficient_data
    "min_required_fields_for_confidence": 3,
    "engineered_features": ["bmi"],
    "excluded_from_model": [
        "family_history — not present in the source dataset; do not fabricate it.",
        "All hormone panels (AMH, FSH, LH, TSH, PRL, PRG, beta-HCG, RBS) — lab-only.",
        "Follicle counts / sizes, endometrium thickness — ultrasound-only.",
        "Blood pressure, pulse, respiratory rate, Hb — clinical-visit-only.",
    ],
}


def main() -> None:
    xls = pd.ExcelFile(SOURCE_XLSX)
    df = xls.parse("Full_new")

    df = df.rename(columns=RAW_COLUMNS)[list(RAW_COLUMNS.values())].copy()

    # BMI: recompute from height/weight so it matches whatever the API will
    # compute at inference time from user-entered height/weight (and to dodge
    # the source column's ~55% null rate).
    df["bmi"] = df["weight_kg"] / ((df["height_cm"] / 100) ** 2)

    # cycle_regularity: 2 = regular -> 0, {4, 5} = irregular -> 1
    df["cycle_regularity"] = (df["cycle_regularity_raw"] != 2).astype(int)
    df = df.drop(columns=["cycle_regularity_raw"])

    # period_duration_days: a single row has 0 (implausible bleeding duration);
    # treat as missing rather than a real 0.
    df.loc[df["period_duration_days"] == 0, "period_duration_days"] = pd.NA

    # fast_food: 1 null in the source -> impute the mode (documented, not silent)
    fast_food_mode = df["fast_food"].mode(dropna=True).iloc[0]
    df["fast_food"] = df["fast_food"].fillna(fast_food_mode).astype(int)

    for col in BINARY_SYMPTOM_FEATURES:
        df[col] = df[col].astype(int)

    df["pcos"] = df["pcos"].astype(int)

    feature_cols = [
        "age",
        "bmi",
        "height_cm",
        "weight_kg",
        "cycle_regularity",
        "period_duration_days",
        *BINARY_SYMPTOM_FEATURES,
    ]
    out = df[["pcos", *feature_cols]]

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    out.to_csv(OUT_CSV, index=False)

    SCHEMA_OUT.parent.mkdir(parents=True, exist_ok=True)
    SCHEMA_OUT.write_text(json.dumps(FEATURE_SCHEMA, indent=2))

    print(f"Wrote {len(out)} rows -> {OUT_CSV}")
    print(f"Wrote feature schema -> {SCHEMA_OUT}")
    print(f"Class balance: {out['pcos'].value_counts().to_dict()}")
    print(f"period_duration_days missing: {out['period_duration_days'].isna().sum()} row(s)")


if __name__ == "__main__":
    main()
