-- =====================================================================================
-- SQL 19: Visitors and drop-off (run AFTER 20261201000000_revenue.sql)
--  * page_views: one row each time a page opens. Only the page, a random visitor number made by
--    the browser, where they came from (like WhatsApp or Google) and phone or computer.
--    No names, emails, IP addresses or health answers.
--  * check_sessions: one row per health check attempt: the furthest question reached, and whether
--    they finished, gave their email, saw the payment page and saw their results. No answers.
--  * Only admins can read them. Only the server can write them.
-- Safe to run more than once.
-- =====================================================================================

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  path text not null check (char_length(path) between 1 and 120),
  visitor text not null check (char_length(visitor) between 1 and 40),
  source text not null default 'direct' check (char_length(source) <= 30),
  device text not null default 'phone' check (device in ('phone', 'tablet', 'desktop')),
  created_at timestamptz not null default now()
);
create index if not exists page_views_created_idx on public.page_views (created_at);

create table if not exists public.check_sessions (
  id uuid primary key,
  visitor text check (char_length(visitor) <= 40),
  source text check (char_length(source) <= 30),
  device text check (device in ('phone', 'tablet', 'desktop')),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  furthest_question text,                 -- the furthest question they reached
  furthest_index int not null default 0,  -- its number in their check (1 = the first question)
  total int,                              -- how many questions their check had at that point
  completed_at timestamptz,               -- answered every question
  emailed_at timestamptz,                 -- gave their email for the results
  paywall_at timestamptz,                 -- saw the payment page
  unlocked_at timestamptz                 -- saw their full results
);
alter table public.check_sessions add column if not exists emailed_at timestamptz;
create index if not exists check_sessions_started_idx on public.check_sessions (started_at);

alter table public.page_views enable row level security;
alter table public.check_sessions enable row level security;
drop policy if exists "admin reads page views" on public.page_views;
create policy "admin reads page views" on public.page_views for select using (public.is_admin());
drop policy if exists "admin reads check sessions" on public.check_sessions;
create policy "admin reads check sessions" on public.check_sessions for select using (public.is_admin());

-- One call per step. The furthest point only ever moves forward, even if they go back a question.
create or replace function public.track_check(
  p_id uuid, p_visitor text, p_source text, p_device text,
  p_stage text, p_question text, p_index int, p_total int
) returns void language plpgsql security definer set search_path = public as $$
declare
  q boolean := p_stage = 'question' and p_question is not null and p_index between 1 and 500;
begin
  if p_stage not in ('question', 'completed', 'emailed', 'paywall', 'unlocked') then return; end if;
  if p_device not in ('phone', 'tablet', 'desktop') then p_device := null; end if;
  insert into public.check_sessions as c (id, visitor, source, device, furthest_question, furthest_index, total, completed_at, emailed_at, paywall_at, unlocked_at)
  values (p_id, left(p_visitor, 40), left(p_source, 30), p_device,
    case when q then left(p_question, 40) end, case when q then p_index else 0 end, case when q then least(p_total, 500) end,
    case when p_stage = 'completed' then now() end, case when p_stage = 'emailed' then now() end, case when p_stage = 'paywall' then now() end, case when p_stage = 'unlocked' then now() end)
  on conflict (id) do update set
    updated_at = now(),
    furthest_question = case when q and p_index > c.furthest_index then left(p_question, 40) else c.furthest_question end,
    total = case when q and p_index > c.furthest_index then least(p_total, 500) else c.total end,
    furthest_index = case when q then greatest(c.furthest_index, p_index) else c.furthest_index end,
    completed_at = case when p_stage = 'completed' then coalesce(c.completed_at, now()) else c.completed_at end,
    emailed_at = case when p_stage = 'emailed' then coalesce(c.emailed_at, now()) else c.emailed_at end,
    paywall_at = case when p_stage = 'paywall' then coalesce(c.paywall_at, now()) else c.paywall_at end,
    unlocked_at = case when p_stage = 'unlocked' then coalesce(c.unlocked_at, now()) else c.unlocked_at end;
end $$;
revoke execute on function public.track_check(uuid, text, text, text, text, text, int, int) from public, anon, authenticated;
