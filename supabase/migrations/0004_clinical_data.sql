-- §4 Optional Clinical Data.
--
-- Additive and nullable on purpose: every existing row stays valid, and all
-- existing reads/writes (which never mention this column) keep working
-- unchanged. Values here are user-entered lab results they already hold —
-- they are NEVER fed to the ML model and are never interpreted server-side;
-- they are carried only as context for the doctor-ready summary.
alter table public.assessments
  add column if not exists clinical_data jsonb;

comment on column public.assessments.clinical_data is
  'Optional user-entered lab/vital values for the doctor-ready report. Not used by the screening model and not clinically interpreted.';
