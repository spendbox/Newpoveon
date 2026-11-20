-- =====================================================================================
-- Care for your parents (run AFTER the earlier scripts). Safe to run more than once.
-- For Nigerians abroad who want a doctor-led plan for a parent at home.
-- =====================================================================================

-- 1. Family enquiries are stored with the other requests.
alter table public.service_requests drop constraint if exists service_requests_kind_check;
alter table public.service_requests add constraint service_requests_kind_check
  check (kind in ('home_test', 'medication', 'family_care'));

-- 2. Exchange rates for showing prices abroad (naira per 1 unit). Edit in Admin → Pricing.
--    Empty = that currency isn't shown.
alter table public.pricing_settings add column if not exists fx_gbp numeric(10, 2);
alter table public.pricing_settings add column if not exists fx_usd numeric(10, 2);
alter table public.pricing_settings add column if not exists fx_eur numeric(10, 2);
alter table public.pricing_settings add column if not exists fx_cad numeric(10, 2);
alter table public.pricing_settings add column if not exists fx_updated_at timestamptz;

-- 3. Who a plan is for: the member themself, a family member paying for a parent, or both.
alter table public.care_plans add column if not exists audience text not null default 'self'
  check (audience in ('self', 'family', 'both'));

-- 4. Building blocks that families abroad value most (costs empty until you set them).
insert into public.care_components (code, name, category, unit, notes, sort) values
  ('family-report', 'Monthly family report', 'coordinator', 'per month', 'Readings, visits, medicines and the doctor''s notes, sent to the family.', 21),
  ('family-doctor-call', 'Family video call with the doctor', 'doctor', 'per call', 'The doctor, the parent and their children on one call.', 12),
  ('hospital-escort', 'Hospital or clinic escort', 'visit', 'per visit', 'A care worker accompanies the parent to appointments.', 32),
  ('emergency-coordination', '24/7 emergency coordination', 'coordinator', 'per month', 'One number to call; we arrange the ambulance, hospital and updates.', 22),
  ('wellbeing-visit', 'Wellbeing home visit (care worker)', 'visit', 'per visit', 'A friendly check on the parent, their home and their medicines.', 33)
on conflict (code) do nothing;

-- 5. The goal and four starter plans. Switch the goal on in Admin → Care plans when priced.
insert into public.care_goals (code, name, area, description, sort) values
  ('parent-care', 'Look after my parent''s health from abroad', 'Family', 'A named doctor, regular checks and monthly reports for a parent in Nigeria, managed by their children abroad.', 5)
on conflict (code) do nothing;

do $$
declare g uuid; p uuid; c record;
begin
  select id into g from public.care_goals where code = 'parent-care';
  for c in select * from (values
      ('essential', 'Parent care · Essential', 'A named doctor, quarterly reviews, yearly full health check and a monthly family report.', 10),
      ('plus', 'Parent care · Plus', 'Adds home sample collection, a BP monitor, medicines delivered and a wellbeing visit every quarter.', 20),
      ('premium', 'Parent care · Premium', 'Monthly doctor reviews, a home visit every month, family video calls and 24/7 emergency coordination.', 30),
      ('concierge', 'Parent care · Concierge', 'A dedicated doctor, weekly wellbeing visits, hospital escorts and specialists arranged.', 40)
    ) as t(tier, name, summary, sort)
  loop
    insert into public.care_plans (goal_id, tier, name, summary, audience, sort) values (g, c.tier, c.name, c.summary, 'family', c.sort)
      on conflict (goal_id, tier, name) do nothing;
  end loop;

  for c in select * from (values
      ('Parent care · Essential', 'doctor-review', 4), ('Parent care · Essential', 'labs-full-check', 1), ('Parent care · Essential', 'coordinator-month', 12), ('Parent care · Essential', 'family-report', 12), ('Parent care · Essential', 'overhead-month', 12),
      ('Parent care · Plus', 'doctor-review', 6), ('Parent care · Plus', 'labs-full-check', 1), ('Parent care · Plus', 'home-collection', 2), ('Parent care · Plus', 'device-bp-monitor', 1), ('Parent care · Plus', 'medicine-delivery', 12), ('Parent care · Plus', 'wellbeing-visit', 4), ('Parent care · Plus', 'coordinator-month', 12), ('Parent care · Plus', 'family-report', 12), ('Parent care · Plus', 'family-doctor-call', 2), ('Parent care · Plus', 'overhead-month', 12),
      ('Parent care · Premium', 'doctor-review-senior', 12), ('Parent care · Premium', 'labs-full-check', 1), ('Parent care · Premium', 'home-collection', 4), ('Parent care · Premium', 'device-bp-monitor', 1), ('Parent care · Premium', 'medicine-delivery', 12), ('Parent care · Premium', 'home-visit-nurse', 12), ('Parent care · Premium', 'coordinator-month', 12), ('Parent care · Premium', 'family-report', 12), ('Parent care · Premium', 'family-doctor-call', 4), ('Parent care · Premium', 'emergency-coordination', 12), ('Parent care · Premium', 'overhead-month', 12),
      ('Parent care · Concierge', 'doctor-review-senior', 24), ('Parent care · Concierge', 'labs-full-check', 2), ('Parent care · Concierge', 'home-collection', 6), ('Parent care · Concierge', 'device-bp-monitor', 1), ('Parent care · Concierge', 'medicine-delivery', 12), ('Parent care · Concierge', 'home-visit-doctor', 12), ('Parent care · Concierge', 'wellbeing-visit', 52), ('Parent care · Concierge', 'hospital-escort', 6), ('Parent care · Concierge', 'coordinator-month', 12), ('Parent care · Concierge', 'family-report', 12), ('Parent care · Concierge', 'family-doctor-call', 12), ('Parent care · Concierge', 'emergency-coordination', 12), ('Parent care · Concierge', 'overhead-month', 12)
    ) as t(plan, comp, qty)
  loop
    select id into p from public.care_plans where name = c.plan;
    insert into public.care_plan_items (plan_id, component_id, quantity)
      select p, id, c.qty from public.care_components where code = c.comp
      on conflict (plan_id, component_id) do nothing;
  end loop;
end $$;
