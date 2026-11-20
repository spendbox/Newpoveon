-- =====================================================================================
-- Wellbeing score column (run AFTER the earlier scripts). Safe to run more than once.
-- The full results are already saved in "results"; this copies the WHO-5 wellbeing score
-- (0 to 100) into its own column so the team can sort, filter and count by it in Supabase.
-- =====================================================================================

alter table public.screenings add column if not exists wellbeing_score int
  check (wellbeing_score is null or wellbeing_score between 0 and 100);

-- Fill it in for checks saved before this column existed.
update public.screenings
   set wellbeing_score = (results -> 'wellbeing' ->> 'score')::int
 where wellbeing_score is null
   and jsonb_typeof(results -> 'wellbeing') = 'object'
   and (results -> 'wellbeing' ->> 'score') ~ '^[0-9]+$';

create index if not exists screenings_wellbeing_idx on public.screenings (wellbeing_score) where wellbeing_score is not null;
