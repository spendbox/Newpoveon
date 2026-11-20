-- =====================================================================================
-- "Something else" option (run AFTER the earlier scripts). Safe to run more than once.
-- Lets people type their own concern when it isn't in the list. It's shown last, sees a
-- general physician, asks the safety questions first, and starts at the same fee as
-- "Help me understand my results". Change the fee in Admin → Consults and fees.
-- =====================================================================================

insert into public.consult_types (code, name, description, grp, doctor_type, duration_min, price_naira, urgent_check, sort, active)
select 'something-else', 'Something else', 'Tell us in your own words.', 'Something else', 'General physician', 20,
       coalesce((select price_naira from public.consult_types where code = 'results-review'),
                (select price_naira from public.consult_types where code = 'new-symptom')),
       true, 999, true
on conflict (code) do nothing;
