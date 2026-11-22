-- =====================================================================================
-- SQL 17: Poveon member IDs and biological age results (run AFTER 20261129000000_paid_check.sql)
--  * Every account gets a short member ID, like PV-7K3M9Q, that people can share on WhatsApp.
--    It's made automatically, never changes, and can't be edited by the user.
--  * bio_age_results holds each biological age (PhenoAge) result your team enters in Admin.
--    People can read only their own results; only the server (Admin) can write them.
--  * Adds the "Biological Age Check" lab package.
-- Safe to run more than once.
-- =====================================================================================

-- ------------------------------------------------------------------ Member IDs
alter table public.profiles add column if not exists member_code text;
create unique index if not exists profiles_member_code_idx on public.profiles (member_code);

-- No 0/O, 1/I/L, so the ID is easy to read out and type.
create or replace function public.new_member_code() returns text
language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  c text;
  i int;
begin
  loop
    c := 'PV-';
    for i in 1..6 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where member_code = c);
  end loop;
  return c;
end $$;

create or replace function public.profiles_member_code() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.member_code is null then new.member_code := public.new_member_code(); end if;
  else
    -- Once set, it never changes.
    new.member_code := coalesce(old.member_code, public.new_member_code());
  end if;
  return new;
end $$;

drop trigger if exists profiles_member_code on public.profiles;
create trigger profiles_member_code before insert or update on public.profiles
  for each row execute function public.profiles_member_code();

-- Give everyone who already has an account an ID.
update public.profiles set member_code = null where member_code is null;

-- ------------------------------------------------------------------ Biological age results
create table if not exists public.bio_age_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  member_code text not null,
  sample_date date not null,
  age_years numeric(5, 2) not null,           -- real age on the day of the test
  markers jsonb not null,                     -- the nine results, in the units the formula uses
  entered jsonb,                              -- the numbers and units exactly as typed, for checking
  pheno_age numeric(5, 1) not null,           -- the biological age
  lab_name text,
  lab_ref text,
  notes text,                                 -- shown to the person
  entered_by text not null,                   -- admin email, for quality control
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists bio_age_results_user_idx on public.bio_age_results (user_id, sample_date desc);
create index if not exists bio_age_results_code_idx on public.bio_age_results (member_code);

alter table public.bio_age_results enable row level security;
drop policy if exists "own bio age read" on public.bio_age_results;
create policy "own bio age read" on public.bio_age_results for select using (user_id = auth.uid() or public.is_admin());

-- ------------------------------------------------------------------ The lab package
insert into public.home_tests (code, name, description, category, is_bundle, includes, sample, fasting, turnaround, notes, collection, featured, sort) values
  ('biological-age', 'Biological Age Check', 'Find out how old your body really is, from nine routine blood results.', 'wellness', true,
    '{"Full blood count (FBC) with differential, including RDW","Liver function test (albumin and alkaline phosphatase)","Kidney function (electrolytes, urea, creatinine)","Fasting blood sugar","hs-CRP (inflammation)"}',
    'Blood', true, '48–72 hours', 'Fast for 8–10 hours before (water is fine). Wait 2 weeks after any illness.', 'home', true, 5)
on conflict (code) do update set
  name = excluded.name, description = excluded.description, category = excluded.category, is_bundle = excluded.is_bundle,
  includes = excluded.includes, sample = excluded.sample, fasting = excluded.fasting, turnaround = excluded.turnaround,
  notes = excluded.notes, collection = excluded.collection, sort = excluded.sort, updated_at = now();
