-- SHELIX 2026 PCOS AI Screening — initial schema
-- Design notes:
--   * Anonymous screening never writes rows (client-side only), so every row here
--     belongs to an authenticated user. user_id is still nullable defensively but
--     RLS requires auth.uid() = user_id for all access.
--   * risk_probability/risk_band/shap_values must never be surfaced as a diagnosis —
--     enforced in the app layer, not the schema.

create extension if not exists vector;

-- ── profiles ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- auto-create a profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── assessments ──────────────────────────────────────────────────────────
create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  raw_answers jsonb not null,
  derived_features jsonb not null,
  is_simulation boolean not null default false
);

create index if not exists assessments_user_id_created_at_idx
  on public.assessments (user_id, created_at desc);

alter table public.assessments enable row level security;

create policy "assessments_select_own" on public.assessments
  for select using (auth.uid() = user_id);
create policy "assessments_insert_own" on public.assessments
  for insert with check (auth.uid() = user_id);
create policy "assessments_delete_own" on public.assessments
  for delete using (auth.uid() = user_id);

-- ── risk_results ─────────────────────────────────────────────────────────
create table if not exists public.risk_results (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  model_version text not null,
  risk_probability numeric not null check (risk_probability >= 0 and risk_probability <= 1),
  risk_band text not null check (risk_band in ('low', 'moderate', 'elevated')),
  confidence_score numeric not null check (confidence_score >= 0 and confidence_score <= 1),
  is_insufficient_data boolean not null default false,
  shap_values jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists risk_results_assessment_id_idx
  on public.risk_results (assessment_id);

alter table public.risk_results enable row level security;

-- risk_results has no user_id of its own — scope through the parent assessment
create policy "risk_results_select_own" on public.risk_results
  for select using (
    exists (
      select 1 from public.assessments a
      where a.id = risk_results.assessment_id and a.user_id = auth.uid()
    )
  );
create policy "risk_results_insert_own" on public.risk_results
  for insert with check (
    exists (
      select 1 from public.assessments a
      where a.id = risk_results.assessment_id and a.user_id = auth.uid()
    )
  );

-- ── guideline_chunks (medical assistant retrieval corpus) ─────────────────
create table if not exists public.guideline_chunks (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  title text not null,
  content text not null,
  citation_url text,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists guideline_chunks_embedding_idx
  on public.guideline_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 50);

alter table public.guideline_chunks enable row level security;

-- curated corpus is public read (no PII), written only by service role (seed script)
create policy "guideline_chunks_select_all" on public.guideline_chunks
  for select using (true);

-- ── assistant_messages ──────────────────────────────────────────────────
create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  cited_chunk_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists assistant_messages_user_id_created_at_idx
  on public.assistant_messages (user_id, created_at desc);

alter table public.assistant_messages enable row level security;

create policy "assistant_messages_select_own" on public.assistant_messages
  for select using (auth.uid() = user_id);
create policy "assistant_messages_insert_own" on public.assistant_messages
  for insert with check (auth.uid() = user_id);
create policy "assistant_messages_delete_own" on public.assistant_messages
  for delete using (auth.uid() = user_id);

-- ── consent_log ───────────────────────────────────────────────────────────
create table if not exists public.consent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  consent_type text not null,
  granted_at timestamptz not null default now()
);

alter table public.consent_log enable row level security;

create policy "consent_log_select_own" on public.consent_log
  for select using (auth.uid() = user_id);
create policy "consent_log_insert_own" on public.consent_log
  for insert with check (auth.uid() = user_id);

-- ── right-to-delete RPC ───────────────────────────────────────────────────
create or replace function public.delete_my_data()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.assessments where user_id = auth.uid();
  delete from public.assistant_messages where user_id = auth.uid();
  delete from public.consent_log where user_id = auth.uid();
end;
$$;
