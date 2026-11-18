-- =====================================================================================
-- Goal-based consults + weekly availability (run AFTER the earlier scripts). Safe to run again.
--  * Consult types: what people need help with, which doctor they see, and the price.
--  * Weekly schedule: hours that repeat every week, with closed days and extra hours.
--    A booked time disappears automatically. "Capacity" = how many people can book the
--    same time (1 now; more when more doctors join).
-- =====================================================================================

-- ------------------------------------------------------------------ Consult types
create table if not exists public.consult_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,                 -- as people say it: "I have a new symptom"
  description text,
  grp text not null default 'Common', -- for grouping on the page
  doctor_type text not null default 'General physician',
  duration_min int not null default 20 check (duration_min between 5 and 180),
  price_naira int check (price_naira is null or price_naira >= 0),  -- empty = can't be booked yet
  urgent_check boolean not null default true,   -- ask about danger signs first
  credit_to_plan boolean not null default false, -- fee credited if they join a plan (your choice)
  active boolean not null default true,
  sort int not null default 100,
  updated_at timestamptz not null default now()
);
alter table public.consult_types enable row level security;
drop policy if exists "public consult types" on public.consult_types;
create policy "public consult types" on public.consult_types for select using (active and price_naira is not null);

insert into public.consult_types (code, name, description, grp, doctor_type, duration_min, price_naira, urgent_check, sort, active) values
  ('quick-question', 'I have a quick health question', 'Advice on a medicine, a result or what to do next.', 'Common', 'General physician', 10, null, false, 10, true),
  ('new-symptom', 'I''m unwell and don''t know why', 'For example fever, headache, pain, a cough or a rash.', 'Common', 'General physician', 20, 5000, true, 20, true),
  ('results-review', 'Help me understand my results', 'Your HealthCheck, lab or scan results explained.', 'Common', 'General physician', 20, 5000, false, 30, true),
  ('condition-review', 'Review my blood pressure, diabetes or other condition', 'Medicines, readings and what to change.', 'Ongoing care', 'General physician', 20, 5000, false, 40, true),
  ('weight', 'I''m worried about my weight', 'Weight gain, losing weight without trying, or wanting to lose weight safely.', 'Ongoing care', 'General physician', 25, null, true, 50, true),
  ('sexual-health', 'Sexual health or performance', 'Erections, libido, STIs or contraception. Private and discreet.', 'Private matters', 'General physician', 20, null, false, 60, true),
  ('womens-health', 'Periods, fertility or pregnancy', 'Trying for a baby, pregnancy questions, period problems.', 'Private matters', 'General physician', 25, null, true, 70, true),
  ('mental-health', 'I''m struggling with stress, mood or sleep', 'A calm, private conversation with a doctor.', 'Private matters', 'General physician', 30, null, true, 80, true),
  ('skin', 'Skin, hair or nails', 'Rashes, acne, eczema, hair loss.', 'Specialists', 'Dermatologist', 20, null, false, 90, true),
  ('second-opinion', 'A second opinion', 'On a diagnosis or treatment plan you''ve been given.', 'Specialists', 'Senior physician', 30, null, false, 100, true)
on conflict (code) do nothing;

alter table public.bookings add column if not exists consult_type_id uuid references public.consult_types (id) on delete set null;
alter table public.bookings add column if not exists consult_type_name text;
alter table public.bookings add column if not exists doctor_type text;

-- ------------------------------------------------------------------ Weekly schedule
create table if not exists public.booking_settings (
  id int primary key default 1 check (id = 1),
  slot_minutes int not null default 20 check (slot_minutes between 5 and 180),
  min_notice_hours int not null default 2 check (min_notice_hours between 0 and 168),
  horizon_days int not null default 21 check (horizon_days between 1 and 120),
  hold_minutes int not null default 30 check (hold_minutes between 5 and 120),
  updated_at timestamptz not null default now()
);
insert into public.booking_settings (id) values (1) on conflict (id) do nothing;

-- weekday: 0 = Sunday … 6 = Saturday. Times are Lagos time.
create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  capacity int not null default 1 check (capacity between 1 and 50),
  doctor_id uuid references public.profiles (id) on delete set null,  -- for when doctors join
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- A closed day (holiday, leave) or extra hours on one date.
create table if not exists public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  on_date date not null,
  kind text not null check (kind in ('closed', 'extra')),
  start_time time,
  end_time time,
  capacity int not null default 1 check (capacity between 1 and 50),
  note text,
  created_at timestamptz not null default now(),
  check (kind = 'closed' or (start_time is not null and end_time is not null and end_time > start_time))
);

alter table public.booking_settings enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
-- No policies: only our server reads or writes these.

-- A sensible starting week: Monday to Friday 9:00–17:00, Saturday 10:00–14:00. Edit in admin.
insert into public.availability_rules (weekday, start_time, end_time)
select d, '09:00', '17:00' from generate_series(1, 5) d
where not exists (select 1 from public.availability_rules);
insert into public.availability_rules (weekday, start_time, end_time)
select 6, '10:00', '14:00'
where (select count(*) from public.availability_rules) = 5;

-- Hold a time for a booking only if fewer than `p_capacity` people already have it.
-- Paid bookings count; unpaid ones count only while their hold lasts.
create or replace function public.book_time(p_booking uuid, p_starts timestamptz, p_capacity int, p_hold_minutes int)
returns boolean language plpgsql security definer set search_path = public as $$
declare taken int;
begin
  perform pg_advisory_xact_lock(hashtext('book_time:' || p_starts::text));
  select count(*) into taken from public.bookings
   where slot_starts_at = p_starts and id <> p_booking
     and (status in ('paid', 'completed') or (status = 'pending_payment' and created_at > now() - make_interval(mins => p_hold_minutes)));
  if taken >= p_capacity then return false; end if;
  update public.bookings set slot_starts_at = p_starts where id = p_booking;
  return true;
end $$;
revoke execute on function public.book_time(uuid, timestamptz, int, int) from public, anon, authenticated;

-- Paid exactly once. Old-style slot bookings keep their slot; new-style bookings are checked by our server.
create or replace function public.mark_booking_paid(p_reference text, p_amount int)
returns setof public.bookings language plpgsql security definer set search_path = public as $$
declare b public.bookings;
begin
  update public.bookings set status = 'paid', paid_at = now()
   where paystack_reference = p_reference and status in ('pending_payment', 'expired') and amount_kobo = p_amount
  returning * into b;
  if not found then return; end if;
  if b.slot_id is not null then
    update public.availability_slots set status = 'booked', held_until = null where id = b.slot_id and booking_id = b.id;
    if not found then
      update public.bookings set needs_reschedule = true where id = b.id returning * into b;
    end if;
  end if;
  return next b;
end $$;
revoke execute on function public.mark_booking_paid(text, int) from public, anon, authenticated;
