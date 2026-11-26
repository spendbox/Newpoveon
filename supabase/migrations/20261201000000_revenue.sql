-- =====================================================================================
-- SQL 18: Revenue tracking (run AFTER 20261130000000_bio_age.sql)
--  * offline_payments: money your team receives outside the website, like WhatsApp transfers
--    for the Biological Age Check, lab tests or medicines. Entered in Admin → Revenue.
--  * Lets you mark any payment as refunded, so refunds come off the totals.
--  * Only admins can read these. Only the server (Admin) can write them.
-- Safe to run more than once.
-- =====================================================================================

alter table public.plan_purchases add column if not exists refunded_at timestamptz;
alter table public.plan_purchases add column if not exists refund_note text;
alter table public.bookings add column if not exists refunded_at timestamptz;
alter table public.bookings add column if not exists refund_note text;

create index if not exists plan_purchases_paid_at_idx on public.plan_purchases (paid_at) where status = 'paid';
create index if not exists bookings_paid_at_idx on public.bookings (paid_at) where paid_at is not null;

create table if not exists public.offline_payments (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('bio_age', 'lab_test', 'medicine', 'check', 'plan', 'other')),
  description text,
  user_id uuid references auth.users (id) on delete set null,
  member_code text,
  name text,
  email text,
  phone text,
  amount_kobo int not null check (amount_kobo > 0),
  paid_via text not null default 'transfer' check (paid_via in ('transfer', 'cash', 'pos', 'paystack', 'other')),
  paid_at timestamptz not null,
  reference text,
  note text,
  entered_by text not null,
  refunded_at timestamptz,
  refund_note text,
  created_at timestamptz not null default now()
);
create index if not exists offline_payments_paid_at_idx on public.offline_payments (paid_at);

alter table public.offline_payments enable row level security;
drop policy if exists "admin reads offline payments" on public.offline_payments;
create policy "admin reads offline payments" on public.offline_payments for select using (public.is_admin());
