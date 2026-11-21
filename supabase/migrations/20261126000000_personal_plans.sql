-- =====================================================================================
-- Personal plans (run AFTER the earlier scripts). Safe to run more than once.
-- A yearly plan (moving, sleep, weight, eating, calm) with daily ticks and weekly check-ins.
-- People can READ their own plan; every change goes through the server (so nobody can mark
-- their own plan as paid). Payments are confirmed with Paystack on the server.
-- =====================================================================================

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'active', 'expired', 'cancelled')),
  starts_on date,
  paid_until date,
  reminders boolean not null default true,
  last_weekly_email date,
  last_nudge_email date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_goals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  area text not null check (area in ('move', 'sleep', 'weight', 'eat', 'calm')),
  settings jsonb not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (plan_id, area)
);

create table if not exists public.plan_logs (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.plan_goals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  done boolean not null default true,
  value numeric,
  created_at timestamptz not null default now(),
  unique (goal_id, day)
);
create index if not exists plan_logs_user_day_idx on public.plan_logs (user_id, day);

create table if not exists public.plan_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete cascade,
  reference text not null unique,
  amount_kobo int not null check (amount_kobo > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.plans enable row level security;
alter table public.plan_goals enable row level security;
alter table public.plan_logs enable row level security;
alter table public.plan_purchases enable row level security;

drop policy if exists "own plan" on public.plans;
create policy "own plan" on public.plans for select using (auth.uid() = user_id);
drop policy if exists "own plan goals" on public.plan_goals;
create policy "own plan goals" on public.plan_goals for select using (auth.uid() = user_id);
drop policy if exists "own plan logs" on public.plan_logs;
create policy "own plan logs" on public.plan_logs for select using (auth.uid() = user_id);
drop policy if exists "own plan purchases" on public.plan_purchases;
create policy "own plan purchases" on public.plan_purchases for select using (auth.uid() = user_id);
