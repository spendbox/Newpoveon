-- =====================================================================================
-- Paid health check (run AFTER the earlier scripts). Safe to run more than once.
-- Answering is free; seeing the full results costs the check price (default ₦1,500), which also
-- gives a free personal plan for 3 months. Each new paid check renews the plan.
--  * screenings.paid: checks saved before today count as paid, so nobody loses results.
--  * plan_months: how long the plan lasts per paid check (editable in Admin → Consults and fees).
--  * plan_purchases also records check payments (kind = 'check'), even for people with no account yet.
-- =====================================================================================

alter table public.screenings add column if not exists paid boolean not null default true;
alter table public.screenings add column if not exists paid_at timestamptz;

alter table public.booking_settings add column if not exists plan_months int not null default 3 check (plan_months between 1 and 24);

alter table public.plan_purchases alter column plan_id drop not null;
alter table public.plan_purchases alter column user_id drop not null;
alter table public.plan_purchases add column if not exists screening_id uuid references public.screenings (id) on delete set null;
alter table public.plan_purchases add column if not exists email text;
alter table public.plan_purchases add column if not exists kind text not null default 'plan' check (kind in ('plan', 'check'));
create index if not exists plan_purchases_screening_idx on public.plan_purchases (screening_id);
