-- Address advisor warnings from 0001:
--   * vector extension living in public schema
--   * handle_new_user / delete_my_data callable directly via PostgREST RPC

create schema if not exists extensions;
alter extension vector set schema extensions;

-- handle_new_user is trigger-only; it should never be invoked as a public RPC.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- delete_my_data is meant for signed-in users only; auth.uid() is null for
-- anon so it's a no-op for them today, but revoke explicitly rather than
-- relying on that.
revoke execute on function public.delete_my_data() from public;
revoke execute on function public.delete_my_data() from anon;
grant execute on function public.delete_my_data() to authenticated;
