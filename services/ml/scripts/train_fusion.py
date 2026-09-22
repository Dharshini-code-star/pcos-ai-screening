"""Train the multimodal fusion model (clinical + ultrasound).

Strategy: logistic-regression stacking over the two base-model outputs.

    [clinical_probability, ultrasound_probability]
        -> LogisticRegression
        -> calibrated fused screening likelihood

Why stacking and not fixed weights
----------------------------------
A hand-picked blend such as "60% clinical + 40% ultrasound" is arbitrary and
cannot be justified medically. Stacking *learns* the combination from data and
can be evaluated like any other model.

Split discipline
----------------
The fusion model is fitted ONLY on validation-split predictions from the two
base models. The test split of each base model is never used for fitting or
tuning the fusion layer, so it stays a clean held-out set for final reporting.

=============================================================================
BLOCKING PREREQUISITE — read this before expecting a fusion artifact
=============================================================================
Stacking requires PAIRED data: the same subject must have BOTH a clinical
questionnaire and an ultrasound image, with one shared PCOS label.

The two datasets PCOSense currently uses are unpaired and drawn from different
populations:

  * clinical  — Kottarathil PCOS dataset (tabular, 541 records)
  * ultrasound — BTX24/PCOS-ultrasound-dataset (images, 1539 train / 385 test)

There is no subject overlap between them, so there is NO honest way to fit or
validate a fusion model from what is available. Fabricating pairs (for example
by randomly matching a clinical row to an ultrasound image) would produce a
model whose performance numbers are meaningless.

This script therefore refuses to run until a genuinely paired dataset is
supplied at data/fusion/paired.csv with columns:

    subject_id, clinical_probability, ultrasound_probability, label, split

where `split` is "val" or "test". Until then PCOSense shows the clinical and
ultrasound signals SEPARATELY and says plainly that they are not combined.

Run:  python scripts/train_fusion.py
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent.parent
PAIRED_CSV = ML_DIR / "data" / "fusion" / "paired.csv"
ARTIFACTS = ML_DIR / "artifacts"
FUSION_MODEL = ARTIFACTS / "fusion_model.joblib"
FUSION_META = ARTIFACTS / "fusion_metadata.json"

REQUIRED_COLUMNS = {
    "subject_id",
    "clinical_probability",
    "ultrasound_probability",
    "label",
    "split",
}


def main() -> None:
    import joblib
    import numpy as np
    import pandas as pd
    from sklearn.linear_model import LogisticRegression
    from sklearn.metrics import accuracy_score, brier_score_loss, roc_auc_score

    if not PAIRED_CSV.exists():
        raise SystemExit(
            f"No paired dataset found at {PAIRED_CSV}.\n\n"
            "Fusion needs subjects that have BOTH a clinical questionnaire and an\n"
            "ultrasound image with one shared label. The clinical and ultrasound\n"
            "datasets currently used by PCOSense are unpaired and come from different\n"
            "populations, so no fusion model can honestly be fitted from them.\n\n"
            "Supply data/fusion/paired.csv with columns:\n"
            "  subject_id, clinical_probability, ultrasound_probability, label, split\n"
            "  (split in {val, test})\n\n"
            "Until then PCOSense reports the two signals separately, which is the\n"
            "correct behaviour rather than inventing a combined number."
        )

    df = pd.read_csv(PAIRED_CSV)
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise SystemExit(f"{PAIRED_CSV} is missing required columns: {sorted(missing)}")

    # Subject-level guard: a subject must never straddle val and test.
    overlap = set(df.loc[df["split"] == "val", "subject_id"]) & set(
        df.loc[df["split"] == "test", "subject_id"]
    )
    if overlap:
        raise SystemExit(
            f"{len(overlap)} subject_id(s) appear in both val and test splits. "
            "Fusion must be fitted on validation subjects only."
        )

    val = df[df["split"] == "val"]
    test = df[df["split"] == "test"]
    if val.empty:
        raise SystemExit("No rows with split='val' — fusion is fitted on validation data only.")

    features = ["clinical_probability", "ultrasound_probability"]
    x_val = val[features].to_numpy()
    y_val = val["label"].to_numpy()

    # Fitted on validation predictions ONLY.
    fusion = LogisticRegression(max_iter=1000, class_weight="balanced")
    fusion.fit(x_val, y_val)

    metrics: dict = {"n_val_subjects": int(val["subject_id"].nunique())}

    if not test.empty:
        x_test = test[features].to_numpy()
        y_test = test["label"].to_numpy()
        p_test = fusion.predict_proba(x_test)[:, 1]
        metrics.update(
            {
                "n_test_subjects": int(test["subject_id"].nunique()),
                "auroc": float(roc_auc_score(y_test, p_test)),
                "accuracy": float(accuracy_score(y_test, (p_test >= 0.5).astype(int))),
                "brier": float(brier_score_loss(y_test, p_test)),
            }
        )
        # Report the single-modality baselines so fusion has to earn its place.
        for name, col in (("clinical_only", "clinical_probability"), ("ultrasound_only", "ultrasound_probability")):
            metrics[f"{name}_auroc"] = float(roc_auc_score(y_test, test[col].to_numpy()))
    else:
        print("No split='test' rows — fitted fusion but reporting no held-out metrics.")

    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    joblib.dump(fusion, FUSION_MODEL)
    FUSION_META.write_text(
        json.dumps(
            {
                "model_version": "fusion-v1",
                "strategy": "logistic regression stacking over [clinical_probability, ultrasound_probability]",
                "fitted_on": "validation split only; test split untouched",
                "coefficients": fusion.coef_.ravel().tolist(),
                "intercept": float(fusion.intercept_[0]),
                "metrics": metrics,
                "trained_at": datetime.now(timezone.utc).isoformat(),
                "limitations": (
                    "Research prototype. Fusion weights are learned from the supplied paired "
                    "validation data and are not a clinically validated combination rule."
                ),
            },
            indent=2,
        )
    )
    print(f"Saved fusion model -> {FUSION_MODEL}")
    print(json.dumps(metrics, indent=2))
    print("\nCoefficients (clinical, ultrasound):", np.round(fusion.coef_.ravel(), 4))


if __name__ == "__main__":
    main()
