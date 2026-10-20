-- AI Agent Mastery: cohort isolation made fail-closed (2026-10-14).
--
-- Builds on the 2026-10-11 migrations `aimastery_batches_schema` and
-- `aimastery_batches_access_rules` (columns entitlements.aimastery_cohort_start
-- and live_sessions.cohort_start, the triggers that fill them, and a policy that
-- matched a student's cohort to a session's cohort). Those policies had two
-- escape hatches: a NULL cohort on EITHER side matched everything, so a student
-- whose aimastery_cohort_start was NULL could read every cohort's recordings
-- (verified with a rolled-back role simulation). This file removes both.
--
-- Why this can't lock anyone out: the triggers always fill cohort_start on
-- insert/renewal, and every current row is non-null (checked before applying).
-- The CHECK constraints below fail the migration if that were ever untrue.

-- 1. Invariants: an active AI Agent Mastery entitlement and an AI Agent Mastery
--    session must each belong to a cohort.
alter table public.live_sessions drop constraint if exists live_sessions_aimastery_cohort_required;
alter table public.live_sessions add constraint live_sessions_aimastery_cohort_required
  check (tier <> 'aimastery' or cohort_start is not null);

alter table public.entitlements drop constraint if exists entitlements_aimastery_cohort_required;
alter table public.entitlements add constraint entitlements_aimastery_cohort_required
  check (aimastery_expires_at is null or aimastery_cohort_start is not null);

-- 2. Sessions (recordings, join links, resources): strict cohort match.
alter policy "Live sessions require matching active entitlement or admin" on public.live_sessions
using (
  (exists (select 1 from entitlements e where e.user_id = auth.uid() and e.is_admin = true))
  or (tier = 'builder1' and exists (select 1 from entitlements e where e.user_id = auth.uid() and e.builder1_expires_at is not null and e.builder1_expires_at > now()))
  or (tier = 'builder2' and exists (select 1 from entitlements e where e.user_id = auth.uid() and e.builder2_expires_at is not null and e.builder2_expires_at > now()))
  or (tier = 'vibecoding' and exists (select 1 from entitlements e where e.user_id = auth.uid() and e.vibecoding_expires_at is not null and e.vibecoding_expires_at > now()))
  or (tier = 'aimastery' and exists (
        select 1 from entitlements e
         where e.user_id = auth.uid()
           and e.aimastery_expires_at is not null and e.aimastery_expires_at > now()
           and e.aimastery_cohort_start is not null
           and e.aimastery_cohort_start = live_sessions.cohort_start))
  or (tier = 'agentslive' and exists (select 1 from entitlements e where e.user_id = auth.uid() and e.agentslive_expires_at is not null and e.agentslive_expires_at > now()))
);

-- 3. Zoom room link (its URL carries the meeting passcode): only inside the
--    student's own cohort window; no NULL escape hatch.
alter policy "AI Agent Mastery room link: entitled students or admin" on public.aimastery_room
using (
  exists (select 1 from public.entitlements e where e.user_id = auth.uid() and e.is_admin = true)
  or exists (
    select 1 from public.entitlements e
     where e.user_id = auth.uid()
       and e.aimastery_expires_at is not null and e.aimastery_expires_at > now()
       and e.aimastery_cohort_start is not null
       and now() >= e.aimastery_cohort_start - interval '2 hours'
       and now() <  e.aimastery_cohort_start + interval '3 days 5 hours'
  )
);

-- 4. Admins can see which cohort each session belongs to (the admin list only
--    showed the date, so a recording could be pasted on the wrong batch's row
--    unnoticed). Return type changes, so drop and recreate, then re-lock.
drop function if exists public.admin_list_live_sessions();
create function public.admin_list_live_sessions()
returns table (
  id uuid, tier text, title text, description text, session_date timestamptz,
  join_link text, recording_url text, recording_passcode text,
  resources jsonb, topics jsonb, created_at timestamptz, cohort_start timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true and public.admin_session_ok()
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  return query
    select ls.id, ls.tier, ls.title, ls.description, ls.session_date, ls.join_link, ls.recording_url,
           ls.recording_passcode, ls.resources, ls.topics, ls.created_at, ls.cohort_start
    from live_sessions ls
    order by ls.session_date asc;
end;
$$;
revoke execute on function public.admin_list_live_sessions() from public;
revoke execute on function public.admin_list_live_sessions() from anon;
grant  execute on function public.admin_list_live_sessions() to authenticated;
