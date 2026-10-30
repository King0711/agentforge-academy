-- AI Agent Mastery class guide: members only, unlocked by the Day 2 recording.
--
-- The guide (/session/ai-chief-of-staff) used to be a public page whose text
-- shipped in the JS bundle. Now the text lives in public.aimastery_guide (RLS
-- on, no grants — nothing but the functions below can read it) and the page
-- fetches it through get_aimastery_guide(), which returns no rows unless the
-- caller is unlocked. Content itself: aimastery-guide-content.sql.
--
-- Unlocked = an admin, OR a student with live AI Agent Mastery access for whom
-- a Day 2 class (live_sessions, tier 'aimastery', title starting "Day 2") that
-- took place AFTER they first paid has its recording posted. The cohort is a
-- rolling weekly one, so "after they first paid" is what ties the unlock to
-- the Day 2 of the class they are about to attend rather than to some earlier
-- week's recording. Someone who paid before the class began unlocks when that
-- week's Day 2 recording goes up; someone who joined weeks ago is unlocked.
-- Admin-granted access with no payment row falls back to the entitlement
-- start (aimastery_expires_at minus the 6-month window).
--
-- Deploy order: run this file, then aimastery-guide-content.sql, then merge
-- the frontend. (Merging first would leave the guide's lock screen up for
-- everyone until the content is loaded.)

create table if not exists public.aimastery_guide (
  id int primary key check (id = 1),
  css text not null,
  html text not null,
  updated_at timestamptz not null default now()
);
alter table public.aimastery_guide enable row level security;
revoke all on public.aimastery_guide from public, anon, authenticated;

create or replace function public.aimastery_guide_unlocked()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.entitlements e
      where e.user_id = auth.uid() and e.is_admin = true
    )
    or (
      exists (
        select 1 from public.entitlements e
        where e.user_id = auth.uid()
          and e.aimastery_expires_at is not null
          and e.aimastery_expires_at > now()
      )
      and exists (
        select 1 from public.live_sessions s
        where s.tier = 'aimastery'
          and s.title ilike 'day 2%'
          and nullif(btrim(s.recording_url), '') is not null
          and s.session_date > coalesce(
            (select min(p.created_at) from public.payments p
              where p.user_id = auth.uid() and p.plan = 'aimastery' and p.status like 'granted%'),
            (select e.aimastery_expires_at - interval '6 months' from public.entitlements e
              where e.user_id = auth.uid())
          )
      )
    );
$$;

create or replace function public.get_aimastery_guide()
returns table (css text, html text)
language sql
stable
security definer
set search_path = public
as $$
  select g.css, g.html
  from public.aimastery_guide g
  where g.id = 1 and public.aimastery_guide_unlocked();
$$;

-- Three statements each, not one: a fresh function is otherwise callable by
-- anon through both PUBLIC and this project's default privileges (CLAUDE.md,
-- "CORS" section). Both functions return nothing/false for a signed-out
-- caller anyway (auth.uid() is null), this keeps them off the anon surface.
revoke execute on function public.aimastery_guide_unlocked() from public;
revoke execute on function public.aimastery_guide_unlocked() from anon;
grant  execute on function public.aimastery_guide_unlocked() to authenticated;

revoke execute on function public.get_aimastery_guide() from public;
revoke execute on function public.get_aimastery_guide() from anon;
grant  execute on function public.get_aimastery_guide() to authenticated;
