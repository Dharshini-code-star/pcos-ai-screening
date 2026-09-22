-- Migration 0001 gave public.assessments select/insert/delete policies but no
-- UPDATE policy. With RLS enabled that makes any update silently match zero
-- rows (PostgREST returns no error), which is how the optional clinical-data
-- save appeared to succeed while writing nothing.
--
-- Scoped to the owner on both sides: `using` gates which rows can be updated,
-- `with check` stops a row being reassigned to another user_id.
create policy "assessments_update_own" on public.assessments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
