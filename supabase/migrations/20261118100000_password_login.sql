-- =====================================================================================
-- Email + password accounts (run AFTER the earlier two scripts). Safe to run more than once.
-- New people confirm their email with a one-time code, then choose a password.
-- After that they log in with email + password.
-- =====================================================================================
alter table public.profiles add column if not exists has_password boolean not null default false;
-- Only our server changes this (people can't flip it themselves).
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, latest_answers, updated_at) on public.profiles to authenticated;
