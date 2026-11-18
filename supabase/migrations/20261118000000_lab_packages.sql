-- =====================================================================================
-- Lab test packages (run AFTER 20261117000000_init.sql)
-- Adds categories, test lists, sample type, fasting, turnaround and more to home_tests,
-- and loads a standard set of packages. Prices are left empty on purpose: set them in
-- Admin → Lab tests. Safe to run more than once.
-- =====================================================================================

alter table public.home_tests add column if not exists category text not null default 'single'
  check (category in ('full', 'heart', 'diabetes', 'women', 'men', 'fertility', 'sexual', 'premarital', 'pregnancy', 'organs', 'wellness', 'single'));
alter table public.home_tests add column if not exists sample text;             -- e.g. "Blood and urine"
alter table public.home_tests add column if not exists fasting boolean not null default false;
alter table public.home_tests add column if not exists turnaround text;          -- e.g. "24–48 hours"
alter table public.home_tests add column if not exists notes text;               -- who it's for, preparation
alter table public.home_tests add column if not exists for_sex text check (for_sex in ('female', 'male'));
alter table public.home_tests add column if not exists collection text not null default 'home' check (collection in ('home', 'lab', 'both'));
alter table public.home_tests add column if not exists featured boolean not null default false;

-- Standard packages. "includes" is the list of tests. Re-running updates the descriptions but
-- never overwrites a price you've set.
insert into public.home_tests (code, name, description, category, is_bundle, includes, sample, fasting, turnaround, notes, for_sex, collection, featured, sort) values
  ('essential-check', 'Essential Health Check', 'A good yearly starting point.', 'full', true,
    '{"Full blood count (FBC)","Fasting blood sugar","Lipid profile (cholesterol)","Urinalysis","Blood pressure check","Weight, height and BMI"}',
    'Blood and urine', true, '24–48 hours', 'Fast for 8–10 hours before (water is fine).', null, 'home', true, 10),
  ('full-health-check', 'Full Health Check', 'A thorough check of your heart, sugar, liver, kidneys, thyroid and infections.', 'full', true,
    '{"Full blood count (FBC)","Fasting blood sugar","HbA1c (3-month sugar)","Lipid profile (cholesterol)","Liver function test (LFT)","Kidney function (electrolytes, urea, creatinine)","Thyroid (TSH)","Uric acid","Urinalysis","Hepatitis B (HBsAg)","Hepatitis C","HIV 1 and 2 screening","Genotype","Blood group","Blood pressure check"}',
    'Blood and urine', true, '48–72 hours', 'Fast for 8–10 hours before (water is fine).', null, 'home', true, 11),
  ('premium-health-check', 'Premium Health Check', 'Everything in the Full Health Check, plus vitamins, iron and inflammation.', 'full', true,
    '{"Everything in the Full Health Check","Vitamin D","Vitamin B12","Ferritin (iron stores)","hs-CRP (inflammation)","Free T4 (thyroid)","PSA (men 40 and over)"}',
    'Blood and urine', true, '3–5 days', 'Fast for 8–10 hours before (water is fine).', null, 'home', false, 12),
  ('heart-check', 'Heart Health Check', 'The tests that matter most for heart attack and stroke risk.', 'heart', true,
    '{"Lipid profile (cholesterol)","Fasting blood sugar","HbA1c (3-month sugar)","Kidney function (electrolytes, urea, creatinine)","hs-CRP (inflammation)","Blood pressure check"}',
    'Blood', true, '24–48 hours', 'Fast for 8–10 hours before.', null, 'home', true, 20),
  ('diabetes-check', 'Diabetes Check', 'Find out if your blood sugar is normal, high or in the pre-diabetes range.', 'diabetes', true,
    '{"Fasting blood sugar","HbA1c (3-month sugar)","Urinalysis","Kidney function (electrolytes, urea, creatinine)","Lipid profile (cholesterol)"}',
    'Blood and urine', true, '24–48 hours', 'Fast for 8–10 hours before.', null, 'home', true, 30),
  ('diabetes-review', 'Diabetes Review', 'For people living with diabetes: the checks to do every 3–12 months.', 'diabetes', true,
    '{"HbA1c (3-month sugar)","Fasting blood sugar","Urine albumin–creatinine ratio (kidney check)","Kidney function (electrolytes, urea, creatinine)","Lipid profile (cholesterol)"}',
    'Blood and urine', true, '24–48 hours', 'Fast for 8–10 hours before.', null, 'home', false, 31),
  ('womens-health', 'Women''s Health Check', 'Key checks for women, including cervical screening.', 'women', true,
    '{"Full blood count (FBC)","Ferritin (iron stores)","Fasting blood sugar","Lipid profile (cholesterol)","Thyroid (TSH)","Cervical screening (HPV test or VIA)","Hepatitis B (HBsAg)","HIV 1 and 2 screening","Urinalysis"}',
    'Blood, urine and cervical sample', true, '3–5 days', 'Cervical screening is done by a trained female nurse. Best not during your period.', 'female', 'both', false, 40),
  ('mens-health', 'Men''s Health Check', 'Key checks for men, including prostate and testosterone.', 'men', true,
    '{"Full blood count (FBC)","Fasting blood sugar","Lipid profile (cholesterol)","PSA (prostate, for men 40 and over)","Testosterone","Liver function test (LFT)","Kidney function (electrolytes, urea, creatinine)","Hepatitis B (HBsAg)"}',
    'Blood', true, '48–72 hours', 'Fast for 8–10 hours before. Morning sample is best for testosterone.', 'male', 'home', false, 41),
  ('fertility-female', 'Fertility Check (Women)', 'Hormone tests a doctor uses to understand ovulation and egg reserve.', 'fertility', true,
    '{"FSH","LH","Estradiol","Prolactin","Thyroid (TSH)","AMH (egg reserve)","Progesterone (day 21)"}',
    'Blood', false, '3–5 days', 'FSH, LH and estradiol are best taken on day 2–3 of your cycle, and progesterone on day 21. We''ll help you plan the dates.', 'female', 'home', false, 50),
  ('fertility-male', 'Fertility Check (Men)', 'Sperm health and the hormones behind it.', 'fertility', true,
    '{"Semen analysis","FSH","LH","Testosterone","Prolactin"}',
    'Semen and blood', false, '2–4 days', 'Semen analysis needs 2–5 days without ejaculation, and the sample must reach the lab within an hour.', 'male', 'lab', false, 51),
  ('sexual-health', 'Sexual Health Screen', 'A private check for common infections. Most have no symptoms.', 'sexual', true,
    '{"HIV 1 and 2","Hepatitis B (HBsAg)","Hepatitis C","Syphilis (VDRL/TPHA)","Gonorrhoea and chlamydia (urine or swab PCR)"}',
    'Blood and urine or swab', false, '2–4 days', 'Results are confidential. A doctor can talk you through them.', null, 'home', true, 60),
  ('premarital', 'Pre-marital Check', 'The tests couples usually do before marriage.', 'premarital', true,
    '{"Genotype","Blood group and Rhesus","HIV 1 and 2","Hepatitis B (HBsAg)","Hepatitis C","Syphilis (VDRL)","Full blood count (FBC)"}',
    'Blood', false, '48–72 hours', 'Book one for each partner.', null, 'home', false, 70),
  ('antenatal-booking', 'Pregnancy (Antenatal) Booking Tests', 'The standard first tests in pregnancy.', 'pregnancy', true,
    '{"Pregnancy test (β-hCG)","Full blood count (FBC)","Blood group and Rhesus","Genotype","HIV 1 and 2","Hepatitis B (HBsAg)","Syphilis (VDRL)","Urinalysis","Random blood sugar"}',
    'Blood and urine', false, '48–72 hours', 'Share the results with your antenatal clinic or one of our doctors.', 'female', 'home', false, 80),
  ('kidney-liver', 'Kidney and Liver Check', 'How well your kidneys and liver are working.', 'organs', true,
    '{"Kidney function (electrolytes, urea, creatinine)","Liver function test (LFT)","Uric acid","Urinalysis"}',
    'Blood and urine', false, '24–48 hours', null, null, 'home', false, 90),
  ('thyroid-check', 'Thyroid Check', 'For tiredness, weight changes or a family history of thyroid problems.', 'organs', true,
    '{"TSH","Free T4","Free T3"}',
    'Blood', false, '48–72 hours', null, null, 'home', false, 91),
  ('energy-check', 'Energy and Vitamins Check', 'Common causes of tiredness: iron, vitamins and thyroid.', 'wellness', true,
    '{"Full blood count (FBC)","Ferritin (iron stores)","Vitamin D","Vitamin B12","Thyroid (TSH)"}',
    'Blood', false, '3–5 days', null, null, 'home', false, 100),
  ('hba1c', 'HbA1c (3-month blood sugar)', 'Shows your average blood sugar over 2–3 months.', 'single', false, '{}', 'Blood', false, '24 hours', 'No fasting needed.', null, 'home', false, 205),
  ('psa', 'PSA (prostate test)', 'For men 40 and over, after talking it through with a doctor.', 'single', false, '{}', 'Blood', false, '48 hours', null, 'male', 'home', false, 206),
  ('pregnancy-test', 'Pregnancy test (blood β-hCG)', 'More sensitive than a urine test.', 'single', false, '{}', 'Blood', false, '24 hours', null, 'female', 'home', false, 207),
  ('hiv-test', 'HIV test', 'Confidential HIV 1 and 2 screening.', 'single', false, '{}', 'Blood', false, '24 hours', null, null, 'home', false, 208)
on conflict (code) do update set
  name = excluded.name, description = excluded.description, category = excluded.category, is_bundle = excluded.is_bundle,
  includes = excluded.includes, sample = excluded.sample, fasting = excluded.fasting, turnaround = excluded.turnaround,
  notes = excluded.notes, for_sex = excluded.for_sex, collection = excluded.collection, sort = excluded.sort,
  updated_at = now();

-- Tidy up the single tests from the first migration.
update public.home_tests set category = 'single', sample = 'Blood', turnaround = '24 hours', sort = 200 where code = 'blood-sugar';
update public.home_tests set category = 'single', sample = 'None (measured at home)', turnaround = 'Same visit', sort = 199 where code = 'bp-check';
update public.home_tests set category = 'single', sample = 'Blood', fasting = true, turnaround = '24–48 hours', sort = 201 where code = 'cholesterol';
update public.home_tests set category = 'single', sample = 'Blood', turnaround = '24–48 hours', sort = 202 where code = 'hepatitis-b';
update public.home_tests set category = 'single', sample = 'Blood', turnaround = '48–72 hours', sort = 203 where code = 'genotype';
update public.home_tests set category = 'women', sample = 'Cervical sample', for_sex = 'female', turnaround = '5–10 days', collection = 'both', sort = 204,
  notes = 'Done by a trained female nurse. Best not during your period.' where code = 'cervical-screening';
-- The old 3-test heart bundle is replaced by the Heart Health Check above.
update public.home_tests set active = false where code = 'heart-bundle';
