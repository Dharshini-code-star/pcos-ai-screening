# PCOS Risk Screening — SHELIX 2026

An explainable, uncertainty-aware early PCOS risk **screening** tool. It is not a
diagnostic device — see [Medical framing](#medical-framing) below.

## What it does

1. **Screening questionnaire** — 13 self-reportable, non-invasive questions (age, BMI,
   cycle pattern, common symptoms, two lifestyle factors). No blood tests, no imaging.
2. **AI/ML risk prediction** — a calibrated logistic regression model, trained on the
   public Kottarathil PCOS dataset.
3. **Explainable results** — every result shows the SHAP-based factors that influenced it,
   labeled as associations, never causes.
4. **Confidence & insufficient-data handling** — a confidence score combining answer
   completeness and an out-of-distribution check; low-confidence results show an
   "insufficient data" state instead of a number.
5. **Risk history** — save results over time (opt-in, requires an account) and see a trend
   chart.
6. **"Why did my risk change?"** — pick two saved results and see exactly which answers and
   which SHAP contributions shifted between them.
7. **What-if simulation** — adjust lifestyle factors (weight, fast food, exercise) and see
   the estimate update live, without saving anything.
8. **Doctor-ready report** — a one-page PDF summary formatted for a medical appointment.
9. **Medical information assistant** — a chat assistant grounded only in a small curated
   set of excerpts from the 2023 International Evidence-based PCOS Guideline and WHO, with
   citations and a refusal path for out-of-scope or emergency questions.
10. **Privacy-conscious data handling** — anonymous screening never touches the database;
    saving requires an account; every table is RLS-scoped per user; a one-click
    delete-my-data control exists.

## Repository layout

```
apps/web/         Next.js 16 + TypeScript + Tailwind + shadcn/ui, deployed to Vercel
services/ml/       Python + FastAPI + scikit-learn + SHAP risk model service
supabase/          SQL migrations (schema, RLS) + the curated guideline corpus seed
```

Full detail on each part: [apps/web](apps/web) (once you're in it, see the code), 
[services/ml/README.md](services/ml/README.md) (model card, training pipeline, limitations).

## Running locally

**1. ML service** (see [services/ml/README.md](services/ml/README.md) for the full steps):

```bash
cd services/ml
python -m venv .venv && source .venv/Scripts/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**2. Web app:**

```bash
cd apps/web
npm install
npm run dev
```

`apps/web/.env.local` needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`ML_SERVICE_URL` (defaults to `http://127.0.0.1:8000`), and optionally `ANTHROPIC_API_KEY`
(the medical assistant runs in a "show matched excerpts" stub mode without it — see
`apps/web/src/app/api/assistant/chat/route.ts`).

**Supabase project:** migrations live in `supabase/migrations/`, applied in order. The
project needs the `vector` extension (used by `guideline_chunks`, though retrieval
currently runs on Postgres full-text search rather than embeddings — see that table's
migration comment for why).

**Demo tip:** this Supabase project has email confirmation enabled by default for new
signups, and a fairly low email-send rate limit on the free tier. For a live demo, either
confirm the test account's email ahead of time, or turn off "Confirm email" under
Authentication → Providers → Email in the Supabase dashboard.

## Medical framing

This project follows the 2023 International Evidence-based Guideline for the Assessment
and Management of PCOS and WHO information as its medical foundation. Throughout the app:

- Results are never phrased as a diagnosis. PCOS diagnosis requires clinical evaluation
  against the Rotterdam criteria by a qualified clinician.
- SHAP factor contributions are always phrased as associations, never causes.
- The medical assistant only answers from a curated, cited excerpt set — never from an
  LLM's general medical knowledge — and refuses treatment, dosing, and emergency-triage
  questions, redirecting to a clinician.
- Every risk-bearing screen carries a persistent disclaimer.

See [services/ml/README.md](services/ml/README.md) for the model's training data,
performance, and — importantly — its limitations.
