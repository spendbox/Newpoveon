-- =====================================================================================
-- Poveon / HealthCheck — initial database
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
--
-- Security model (plain English):
--  * Row-level security (RLS) is ON for every table. The public "anon" key that the browser
--    holds can only read the home-test list and emergency contacts. Nothing else.
--  * Logged-in people can read only their own screenings, bookings and requests.
--  * Admins (role = 'admin') can see bookings and requests.
--  * All writes happen on our server with the secret service-role key, after validation.
--  * Roles 'doctor' and 'lab' and the organisations table exist now so the lab request system
--    can be added later without rebuilding.
-- =====================================================================================

-- gen_random_uuid() is built into Postgres 13+, so no extension is needed.

-- ------------------------------------------------------------------ Organisations (future labs/clinics)
create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('lab', 'clinic', 'pharmacy', 'poveon')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ Profiles (one per login)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin', 'doctor', 'lab')),
  organisation_id uuid references public.organisations (id) on delete set null,
  -- The person's latest questionnaire answers, so they can edit any one of them later.
  latest_answers jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_email_idx on public.profiles (lower(email));

-- Create a profile automatically when someone first logs in.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, lower(new.email)) on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ------------------------------------------------------------------ Screenings (results)
create table public.screenings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  phone text,
  answers jsonb not null,
  results jsonb not null,
  results_version int not null,
  heart_age int,
  risk_percent numeric(5, 1),
  consent_at timestamptz not null,
  consent_text text not null,
  -- Lets a guest (no account) manage their share link. Only a hash is stored.
  owner_token_hash text not null,
  share_token text unique,
  share_enabled boolean not null default false,
  created_at timestamptz not null default now()
);
create index screenings_email_idx on public.screenings (lower(email));
create index screenings_user_idx on public.screenings (user_id, created_at desc);

-- ------------------------------------------------------------------ Anonymous counters (no health data)
create table public.events (
  id bigint generated always as identity primary key,
  type text not null check (type in ('started', 'completed')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ Doctor availability and bookings
create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null unique,
  duration_min int not null default 20,
  status text not null default 'open' check (status in ('open', 'held', 'booked', 'blocked')),
  held_until timestamptz,
  booking_id uuid,
  doctor_id uuid references public.profiles (id) on delete set null, -- for when doctors log in
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  phone text not null,
  email text not null,
  reason text not null,
  slot_id uuid references public.availability_slots (id) on delete set null,
  slot_starts_at timestamptz,
  share_results boolean not null default true,
  screening_id uuid references public.screenings (id) on delete set null,
  amount_kobo int not null,
  currency text not null default 'NGN',
  status text not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'completed', 'cancelled', 'expired')),
  needs_reschedule boolean not null default false,
  paystack_reference text not null unique,
  paid_at timestamptz,
  confirmation_sent_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now()
);
create index bookings_status_idx on public.bookings (status, slot_starts_at);
alter table public.availability_slots
  add constraint availability_slots_booking_fk foreign key (booking_id) references public.bookings (id) on delete set null;

-- Every payment check we make with Paystack, for the audit trail. Also ready for home-test payments.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings (id) on delete set null,
  service_request_id uuid,
  reference text not null,
  provider text not null default 'paystack',
  amount_kobo int,
  currency text,
  status text not null,
  source text not null check (source in ('webhook', 'verify')),
  raw jsonb,
  created_at timestamptz not null default now()
);
create index payments_reference_idx on public.payments (reference);

-- Hold a slot for an unpaid booking. Returns true if the slot was free.
create or replace function public.reserve_slot(p_slot uuid, p_booking uuid, p_minutes int)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.availability_slots
     set status = 'held', held_until = now() + make_interval(mins => p_minutes), booking_id = p_booking
   where id = p_slot
     and starts_at > now()
     and (status = 'open' or (status = 'held' and held_until < now()));
  get diagnostics n = row_count;
  return n = 1;
end $$;

-- Mark a booking paid exactly once (safe if the webhook and the redirect both arrive).
-- Returns the booking only the first time, so the confirmation email is sent once.
create or replace function public.mark_booking_paid(p_reference text, p_amount int)
returns setof public.bookings language plpgsql security definer set search_path = public as $$
declare b public.bookings;
begin
  update public.bookings set status = 'paid', paid_at = now()
   where paystack_reference = p_reference and status in ('pending_payment', 'expired') and amount_kobo = p_amount
  returning * into b;
  if not found then return; end if;
  update public.availability_slots set status = 'booked', held_until = null
   where id = b.slot_id and booking_id = b.id;
  if not found then
    -- The hold ran out and someone else took the slot: keep the payment, flag for the team.
    update public.bookings set needs_reschedule = true where id = b.id returning * into b;
  end if;
  return next b;
end $$;

-- ------------------------------------------------------------------ Home tests (admin-editable list)
create table public.home_tests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  price_naira int check (price_naira is null or price_naira >= 0),
  is_bundle boolean not null default false,
  includes text[] not null default '{}',
  active boolean not null default true,
  sort int not null default 100,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ Home-test and medication requests
create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('home_test', 'medication')),
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  address text not null,
  preferred_time text,
  test_id uuid references public.home_tests (id) on delete set null,
  test_name text,
  details jsonb not null default '{}',
  has_prescription boolean,
  status text not null default 'new' check (status in ('new', 'in_progress', 'handled', 'cancelled')),
  -- Ready for online payment later:
  amount_kobo int,
  payment_status text not null default 'not_required' check (payment_status in ('not_required', 'pending', 'paid', 'refunded')),
  handled_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now()
);
create index service_requests_status_idx on public.service_requests (status, created_at desc);
alter table public.payments
  add constraint payments_service_request_fk foreign key (service_request_id) references public.service_requests (id) on delete set null;

-- ------------------------------------------------------------------ Emergency contacts (admin-editable)
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  phone text, -- null = placeholder, never shown to users
  description text,
  is_placeholder boolean not null default false,
  active boolean not null default true,
  sort int not null default 100
);

-- =====================================================================================
-- Row-level security
-- =====================================================================================
alter table public.organisations enable row level security;
alter table public.profiles enable row level security;
alter table public.screenings enable row level security;
alter table public.events enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.home_tests enable row level security;
alter table public.service_requests enable row level security;
alter table public.emergency_contacts enable row level security;

-- Profiles: people see and edit their own (but can never change their own role).
create policy "own profile read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, latest_answers, updated_at) on public.profiles to authenticated;

-- Screenings: only your own. Admins do NOT get blanket access to health answers.
create policy "own screenings read" on public.screenings for select using (user_id = auth.uid());
create policy "own screenings delete" on public.screenings for delete using (user_id = auth.uid());

-- Bookings and requests: your own, and admins.
create policy "own bookings read" on public.bookings for select using (user_id = auth.uid() or public.is_admin());
create policy "admin bookings write" on public.bookings for update using (public.is_admin());
create policy "own requests read" on public.service_requests for select using (user_id = auth.uid() or public.is_admin());
create policy "admin requests write" on public.service_requests for update using (public.is_admin());

-- Slots, payments, events, organisations: admins only (the public sees slots via our server).
create policy "admin slots" on public.availability_slots for all using (public.is_admin()) with check (public.is_admin());
create policy "admin payments read" on public.payments for select using (public.is_admin());
create policy "admin events read" on public.events for select using (public.is_admin());
create policy "admin organisations" on public.organisations for all using (public.is_admin()) with check (public.is_admin());

-- Public lists.
create policy "public home tests" on public.home_tests for select using (active or public.is_admin());
create policy "admin home tests" on public.home_tests for all using (public.is_admin()) with check (public.is_admin());
create policy "public emergency contacts" on public.emergency_contacts for select using ((active and phone is not null) or public.is_admin());
create policy "admin emergency contacts" on public.emergency_contacts for all using (public.is_admin()) with check (public.is_admin());

-- Functions run only from our server.
revoke execute on function public.reserve_slot(uuid, uuid, int) from public, anon, authenticated;
revoke execute on function public.mark_booking_paid(text, int) from public, anon, authenticated;

-- =====================================================================================
-- Starting data (edit in the admin area)
-- =====================================================================================
insert into public.emergency_contacts (label, phone, description, is_placeholder, sort) values
  ('Nigeria emergency number', '112', 'Free from any phone, 24 hours.', false, 1),
  ('Mental health helpline (ADD THE NUMBER IN ADMIN)', null, 'Placeholder: add a verified helpline number before launch.', true, 2);

-- Prices are left empty on purpose: set them in Admin → Home tests.
insert into public.home_tests (code, name, description, is_bundle, includes, sort) values
  ('bp-check', 'Blood pressure check', 'A nurse measures your blood pressure at home.', false, '{}', 1),
  ('blood-sugar', 'Blood sugar test', 'A quick finger-prick or fasting sugar test.', false, '{}', 2),
  ('hepatitis-b', 'Hepatitis B test', 'A blood test for hepatitis B (HBsAg).', false, '{}', 3),
  ('genotype', 'Genotype test', 'Find out if you are AA, AS, SS or AC.', false, '{}', 4),
  ('cholesterol', 'Cholesterol (lipid) test', 'Checks your cholesterol levels.', false, '{}', 5),
  ('cervical-screening', 'Cervical screening', 'HPV test or VIA, arranged with a trained nurse.', false, '{}', 6),
  ('heart-bundle', 'Heart health bundle', 'Blood pressure, blood sugar and cholesterol together.', true, '{"Blood pressure check","Blood sugar test","Cholesterol (lipid) test"}', 10);
