# PCOS Screening ML Service

FastAPI service exposing the risk screening model. **Not a diagnostic API** — see
Limitations below and the disclaimer embedded in every `/assess` response.

## Model card

| | |
|---|---|
| Task | Binary risk screening (PCOS-consistent-symptom-pattern vs. not), calibrated probability output |
| Model | Logistic Regression (`class_weight="balanced"`), Platt-calibrated via 5-fold `CalibratedClassifierCV` |
| Selected over | Gradient Boosting (comparable CV AUROC, less interpretable — see `scripts/train.py` output) |
| Explainability | Exact SHAP via `LinearExplainer` |
| Features | 13 self-reportable, non-invasive fields only — see `app/feature_schema.json`. No lab values, no imaging. |
| Training data | [`PCOS_data_without_infertility`](https://www.kaggle.com/datasets/prasoonkottarathil/polycystic-ovary-syndrome-pcos) (Kottarathil, Kaggle) — 541 women evaluated across ten hospitals in Kerala, India; 364 non-PCOS / 177 PCOS |
| Held-out test AUROC | ~0.88 (20% stratified split, never used for model selection or calibration) |

Run `python scripts/prepare_dataset.py && python scripts/train.py` to regenerate
`artifacts/` and see the full metrics printed to stdout (also saved to
`artifacts/metadata.json`).

### Why these 13 features and not the full dataset

The source dataset also includes hormone panels (AMH, FSH, LH, TSH, PRL, PRG,
beta-HCG), follicle counts/sizes and endometrium thickness from ultrasound, and
vitals (BP, pulse, Hb) from a clinical visit. This product is a **self-screening
questionnaire**, so all lab- and imaging-only columns were dropped — the model
only ever asks for things a person can answer about themselves. This is a
scope decision, not a data-availability one: dropping ~30 predictive columns
costs some accuracy in exchange for the tool being genuinely usable without a
clinic visit or blood draw.

`family_history` is **not** a model feature, despite being clinically relevant
to PCOS risk (it runs in families) — the training dataset does not contain a
family-history column, and we chose not to fabricate one.

### `period_duration_days` — a dataset quirk worth knowing

The source column is literally named "Cycle length(days)" but its values
(mode 5, range 0–12) don't match real menstrual *cycle* length (typically
21–35 days) — they match menstrual *bleeding/period duration* far better. We
treat and label it as period duration, not full cycle length, and ask users
accordingly. This is a documented quirk of the public dataset, not a
transcription error introduced here.

## Limitations (read before demoing)

- **541 rows, one country, one dataset.** Not clinically validated. Do not
  present headline accuracy numbers as if they generalize.
- **Not diagnostic.** PCOS diagnosis requires the Rotterdam criteria
  (clinical + biochemical + ultrasound), which this tool deliberately does
  not attempt to replicate.
- **SHAP contributions are associational, not causal.** A feature pushing the
  score up does not mean it *causes* PCOS — the API/UI must never phrase it
  that way.
- **Confidence is a heuristic**, combining answer-completeness and an
  IsolationForest novelty check against the training distribution — it is not
  a formal calibration guarantee.

## Running locally

```bash
python -m venv .venv
source .venv/Scripts/activate   # Windows Git Bash; use .venv/bin/activate on macOS/Linux
pip install -r requirements.txt

# Fetch the source dataset (not committed to the repo — see .gitignore):
mkdir -p data
curl -sL -o data/PCOS_data_without_infertility.xlsx \
  https://raw.githubusercontent.com/chenw-3/pcos-analysis/main/PCOS_data_without_infertility.xlsx

python scripts/prepare_dataset.py
python scripts/train.py   # writes artifacts/ — already committed, so this step is optional unless retraining
uvicorn app.main:app --reload --port 8000
```

Set `ALLOWED_ORIGINS` (comma-separated) to control CORS; defaults to
`http://localhost:3000`.

## Endpoints

- `GET /health`
- `GET /model-info` — version, training data size/balance, held-out metrics, limitations
- `POST /assess` — full questionnaire → risk probability, band, confidence, SHAP contributions
- `POST /whatif` — identical computation, separate route so it's never confused with a persisted, history-tracked assessment
