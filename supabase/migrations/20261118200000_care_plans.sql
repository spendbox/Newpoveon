-- =====================================================================================
-- Care plans and pricing (run AFTER the earlier scripts). Safe to run more than once.
-- Everything here is edited in Admin → Care plans and Admin → Pricing.
-- Unit costs are confidential: no public access (only our server reads them).
-- =====================================================================================

-- One row of global pricing settings.
create table if not exists public.pricing_settings (
  id int primary key default 1 check (id = 1),
  default_markup numeric(5, 2) not null default 4.00 check (default_markup >= 1),   -- price ÷ cost; 4 = 75% gross margin
  quarterly_premium numeric(4, 3) not null default 0.100 check (quarterly_premium between 0 and 1),
  monthly_premium numeric(4, 3) not null default 0.150 check (monthly_premium between 0 and 1),
  round_to int not null default 1000 check (round_to >= 0),
  updated_at timestamptz not null default now()
);
insert into public.pricing_settings (id) values (1) on conflict (id) do nothing;

-- The building blocks every plan is made from, with what each one costs Poveon.
create table if not exists public.care_components (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null check (category in ('doctor', 'coordinator', 'test', 'visit', 'medicine', 'device', 'delivery', 'partner', 'overhead', 'other')),
  unit text not null default 'each',
  cost_naira int check (cost_naira is null or cost_naira >= 0),   -- empty until you enter your real cost
  notes text,
  active boolean not null default true,
  sort int not null default 100,
  updated_at timestamptz not null default now()
);

create table if not exists public.care_goals (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  area text not null,
  description text,
  active boolean not null default false,   -- switch on when its plans are ready
  sort int not null default 100
);

create table if not exists public.care_plans (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.care_goals (id) on delete cascade,
  tier text not null check (tier in ('essential', 'plus', 'premium', 'concierge', 'custom')),
  name text not null,
  summary text,
  markup_override numeric(5, 2) check (markup_override is null or markup_override >= 1),
  price_override_naira int check (price_override_naira is null or price_override_naira >= 0),  -- type a price to fix it
  active boolean not null default true,
  sort int not null default 100,
  updated_at timestamptz not null default now(),
  unique (goal_id, tier, name)
);

create table if not exists public.care_plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.care_plans (id) on delete cascade,
  component_id uuid not null references public.care_components (id) on delete restrict,
  quantity numeric(8, 2) not null check (quantity > 0),
  note text,
  unique (plan_id, component_id)
);

-- Choices people make that change the price (e.g. tests at home). Used by the plan offer later.
create table if not exists public.care_options (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  category text,                    -- which component lines it affects (null = none)
  multiplier numeric(5, 3) not null default 1 check (multiplier > 0),
  add_naira int not null default 0,
  active boolean not null default true,
  sort int not null default 100
);

alter table public.pricing_settings enable row level security;
alter table public.care_components enable row level security;
alter table public.care_goals enable row level security;
alter table public.care_plans enable row level security;
alter table public.care_plan_items enable row level security;
alter table public.care_options enable row level security;
-- No policies on purpose: only our server (service role) reads or writes these.

-- ------------------------------------------------------------------ Starting data (edit in admin)
insert into public.care_components (code, name, category, unit, sort) values
  ('doctor-review', 'Doctor review (video or phone)', 'doctor', 'per review', 10),
  ('doctor-review-senior', 'Senior doctor review', 'doctor', 'per review', 11),
  ('coordinator-month', 'Care coordinator check-ins', 'coordinator', 'per month', 20),
  ('home-visit-nurse', 'Home visit (nurse)', 'visit', 'per visit', 30),
  ('home-visit-doctor', 'Home visit (doctor)', 'visit', 'per visit', 31),
  ('labs-bp-baseline', 'Blood pressure starting tests', 'test', 'per set', 40),
  ('labs-kidney', 'Kidney function test', 'test', 'per test', 41),
  ('labs-hba1c', 'HbA1c test', 'test', 'per test', 42),
  ('labs-full-check', 'Full Health Check (lab cost)', 'test', 'per check', 43),
  ('labs-antenatal', 'Antenatal booking tests', 'test', 'per set', 44),
  ('home-collection', 'Home sample collection', 'test', 'per visit', 45),
  ('device-bp-monitor', 'Home BP monitor', 'device', 'each', 50),
  ('medicine-delivery', 'Medicine delivery', 'delivery', 'per delivery', 60),
  ('partner-antenatal', 'Pregnancy partner care (e.g. Preggify)', 'partner', 'per pregnancy', 70),
  ('overhead-month', 'Platform and support overhead', 'overhead', 'per month', 90)
on conflict (code) do nothing;

insert into public.care_goals (code, name, area, sort) values
  ('blood-pressure', 'Keep my blood pressure normal', 'Living with a condition', 10),
  ('diabetes', 'Control my diabetes', 'Living with a condition', 11),
  ('stay-healthy', 'Stay healthy and catch problems early', 'Prevention', 20),
  ('heart-prevention', 'Prevent heart attack and stroke', 'Prevention', 21),
  ('diabetes-prevention', 'Prevent diabetes', 'Prevention', 22),
  ('cancer-risk', 'Know and lower my cancer risk', 'Prevention', 23),
  ('weight', 'Lose weight safely', 'Body', 30),
  ('conceive', 'Get pregnant', 'Family', 40),
  ('pregnancy', 'Have a safe pregnancy and delivery', 'Family', 41),
  ('postnatal', 'Recover well after birth', 'Family', 42),
  ('sexual-performance', 'Improve sexual performance', 'Sexual health', 50),
  ('sexual-safety', 'Stay safe and tested', 'Sexual health', 51),
  ('mind-habits', 'Sleep better, stress less, quit smoking or drink less', 'Mind and habits', 60)
on conflict (code) do nothing;

insert into public.care_options (code, name, description, category, multiplier, add_naira, sort) values
  ('tests-at-home', 'Tests at home', 'Samples collected at home instead of at a partner lab.', 'test', 1.000, 0, 10),
  ('faster-response', 'Faster response', 'Same-day replies from the care team.', 'coordinator', 1.500, 0, 20),
  ('medicines-delivered', 'Medicines delivered', 'Monthly medicine delivery to your door.', null, 1.000, 0, 30)
on conflict (code) do nothing;

-- Starter plans for the first three goals. Quantities are per year.
do $$
declare g uuid; p uuid;
  c record;
begin
  for c in select * from (values
      ('blood-pressure', 'essential', 'Blood pressure · Essential', 'Quarterly doctor reviews, monthly check-ins, tests at a partner lab.', 10),
      ('blood-pressure', 'plus', 'Blood pressure · Plus', 'Adds a home BP monitor, home sample collection and medicine delivery.', 20),
      ('blood-pressure', 'premium', 'Blood pressure · Premium', 'Senior doctor monthly, quarterly home visits, yearly full health check.', 30),
      ('pregnancy', 'essential', 'Safe pregnancy · Essential', 'Antenatal tests, a named doctor and danger-sign alerts alongside your clinic.', 10),
      ('pregnancy', 'plus', 'Safe pregnancy · Plus', 'Partner antenatal care, home BP checks and closer follow-up.', 20),
      ('stay-healthy', 'essential', 'Stay healthy · Essential', 'A yearly full health check and a doctor review of the results.', 10),
      ('stay-healthy', 'plus', 'Stay healthy · Plus', 'Tests at home, a mid-year review and check-ins.', 20)
    ) as t(goal, tier, name, summary, sort)
  loop
    select id into g from public.care_goals where code = c.goal;
    insert into public.care_plans (goal_id, tier, name, summary, sort) values (g, c.tier, c.name, c.summary, c.sort)
      on conflict (goal_id, tier, name) do nothing;
  end loop;

  for c in select * from (values
      ('Blood pressure · Essential', 'doctor-review', 4), ('Blood pressure · Essential', 'coordinator-month', 12), ('Blood pressure · Essential', 'labs-bp-baseline', 1), ('Blood pressure · Essential', 'labs-kidney', 1), ('Blood pressure · Essential', 'overhead-month', 12),
      ('Blood pressure · Plus', 'doctor-review', 6), ('Blood pressure · Plus', 'coordinator-month', 12), ('Blood pressure · Plus', 'labs-bp-baseline', 1), ('Blood pressure · Plus', 'labs-kidney', 1), ('Blood pressure · Plus', 'home-collection', 2), ('Blood pressure · Plus', 'device-bp-monitor', 1), ('Blood pressure · Plus', 'medicine-delivery', 12), ('Blood pressure · Plus', 'home-visit-nurse', 1), ('Blood pressure · Plus', 'overhead-month', 12),
      ('Blood pressure · Premium', 'doctor-review-senior', 12), ('Blood pressure · Premium', 'coordinator-month', 12), ('Blood pressure · Premium', 'labs-full-check', 1), ('Blood pressure · Premium', 'labs-kidney', 2), ('Blood pressure · Premium', 'home-collection', 3), ('Blood pressure · Premium', 'device-bp-monitor', 1), ('Blood pressure · Premium', 'medicine-delivery', 12), ('Blood pressure · Premium', 'home-visit-doctor', 4), ('Blood pressure · Premium', 'overhead-month', 12),
      ('Safe pregnancy · Essential', 'doctor-review', 4), ('Safe pregnancy · Essential', 'coordinator-month', 9), ('Safe pregnancy · Essential', 'labs-antenatal', 1), ('Safe pregnancy · Essential', 'overhead-month', 9),
      ('Safe pregnancy · Plus', 'doctor-review', 6), ('Safe pregnancy · Plus', 'coordinator-month', 9), ('Safe pregnancy · Plus', 'labs-antenatal', 1), ('Safe pregnancy · Plus', 'home-collection', 2), ('Safe pregnancy · Plus', 'partner-antenatal', 1), ('Safe pregnancy · Plus', 'device-bp-monitor', 1), ('Safe pregnancy · Plus', 'overhead-month', 9),
      ('Stay healthy · Essential', 'labs-full-check', 1), ('Stay healthy · Essential', 'doctor-review', 1), ('Stay healthy · Essential', 'overhead-month', 12),
      ('Stay healthy · Plus', 'labs-full-check', 1), ('Stay healthy · Plus', 'home-collection', 1), ('Stay healthy · Plus', 'doctor-review', 2), ('Stay healthy · Plus', 'coordinator-month', 12), ('Stay healthy · Plus', 'overhead-month', 12)
    ) as t(plan, comp, qty)
  loop
    select id into p from public.care_plans where name = c.plan;
    insert into public.care_plan_items (plan_id, component_id, quantity)
      select p, id, c.qty from public.care_components where code = c.comp
      on conflict (plan_id, component_id) do nothing;
  end loop;
end $$;
