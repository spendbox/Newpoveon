-- =====================================================================================
-- More things we can help with (run AFTER the earlier scripts). Safe to run more than once.
-- Adds "Healthy habits" consults: stop smoking, cut down on alcohol, sleep, lowering heart and
-- diabetes risk, and a medicine check. Each starts at the same fee as "Help me understand my
-- results" (or "I'm unwell", if that one has no fee). Change any fee in Admin → Consults and fees.
-- Existing consult types and fees are not touched.
-- =====================================================================================

with base as (
  select coalesce(
    (select price_naira from public.consult_types where code = 'results-review'),
    (select price_naira from public.consult_types where code = 'new-symptom')
  ) as fee
)
insert into public.consult_types (code, name, description, grp, doctor_type, duration_min, price_naira, urgent_check, sort, active)
select v.code, v.name, v.description, v.grp, 'General physician', v.duration_min, base.fee, v.urgent_check, v.sort, true
from base, (values
  ('stop-smoking', 'Help me stop smoking', 'Cigarettes, shisha, snuff or vapes. A quit plan and medicines that double your chances.', 'Healthy habits', 20, false, 42),
  ('alcohol', 'Help me cut down on alcohol', 'Confidential support to drink less, or to stop safely.', 'Healthy habits', 20, false, 44),
  ('sleep', 'I can''t sleep, or I snore loudly', 'Trouble sleeping, loud snoring, or feeling sleepy in the day.', 'Healthy habits', 20, false, 46),
  ('lower-my-risk', 'Lower my heart or diabetes risk', 'A personal plan to bring your heart age, blood pressure or blood sugar down.', 'Healthy habits', 25, false, 48),
  ('medicine-check', 'Check my medicines', 'Side effects, doses, or whether you still need a medicine.', 'Ongoing care', 15, false, 45)
) as v(code, name, description, grp, duration_min, urgent_check, sort)
on conflict (code) do nothing;
