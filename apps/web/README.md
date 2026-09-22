# PCOS Screening — Web App

Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui. See the [repo root README](../../README.md) for the full project overview, and [services/ml/README.md](../../services/ml/README.md) for the risk model.

## Development

```bash
npm install
npm run dev
```

Requires `.env.local` — see `.env.example`. Needs the ML service running (`services/ml`, default `http://127.0.0.1:8000`) for the screening flow to work.

## Structure

- `src/app/` — pages and API route handlers (App Router)
- `src/components/` — `ui/` is shadcn-generated; everything else is feature-organized (`screening/`, `history/`, `whatif/`, `assistant/`, `report/`, `auth/`, `shared/`)
- `src/lib/` — `supabase/` (browser + server clients, generated DB types), `ml/` (typed client for the FastAPI service), `assistant/` (retrieval + system prompt), plus `questionnaire.ts` (the single source of truth for question copy) and `compare.ts`/`history.ts`
- `src/proxy.ts` — Next.js 16's renamed `middleware.ts`; refreshes the Supabase session cookie on every request

## Notable implementation choices

- **Anonymous-first screening**: the questionnaire and result work without an account (nothing is written to the database — see `src/lib/screening-storage.ts`, which holds the in-progress result in `sessionStorage`). Saving requires signing in.
- **Server-recomputed results on save**: `POST /api/assessments` re-runs the ML service server-side rather than trusting a client-supplied result, so saved history can't be tampered with client-side.
- **`/api/assess` and `/api/whatif` are separate routes** even though they call the same ML computation, to keep "this is a saved/history-relevant call" and "this is a disposable simulation" unambiguous at the call site.
