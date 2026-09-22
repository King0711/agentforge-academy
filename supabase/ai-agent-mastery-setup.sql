-- AI Agent Mastery — data model for the new live-cohort arm.
-- Run via the Supabase MCP / CLI, per CLAUDE.md's documented workflow.
-- Run supabase/guide-purchases-setup.sql FIRST — section 5 below
-- (admin_get_all_profiles) queries the guide_purchases table it creates.
--
-- Adds a 5th plan ('aimastery') alongside builder1/builder2/pro/vibecoding,
-- and widens the same plan/tier CHECK constraints and live_sessions RLS
-- that supabase/vibecoding-setup.sql widened when it added 'vibecoding' —
-- this migration is that same shape, one more tier later.
--
-- Public-facing name is "AI Agent Mastery" everywhere — 'aimastery' is
-- purely an internal key (entitlements column / plan value / tier value),
-- never shown to a student. The curriculum runs on a framework the
-- marketing pages deliberately don't name.
--
-- Deliberately no content table (same reasoning as vibecoding-setup.sql):
-- this is live-taught, delivered via the existing live_sessions table
-- (widened below), not pre-published text pages. Unlike Vibe Coding,
-- there's no separate prompt-library-style reference table either — this
-- program is one project (a personal-assistant agent), not a set of
-- discrete reusable prompts.

-- 1. Entitlement column — mirrors vibecoding_expires_at.
alter table public.entitlements
  add column if not exists aimastery_expires_at timestamptz;

-- 2. Widen the three independent plan CHECK constraints to add 'aimastery'.
--    Each of these is its own constraint (not a shared enum type), so all
--    three need this same drop/add pair.
alter table public.payments drop constraint if exists payments_plan_check;
alter table public.payments add constraint payments_plan_check
  check (plan in ('builder1', 'builder2', 'pro', 'vibecoding', 'aimastery'));

alter table public.checkout_attempts drop constraint if exists checkout_attempts_plan_check;
alter table public.checkout_attempts add constraint checkout_attempts_plan_check
  check (plan in ('builder1', 'builder2', 'pro', 'vibecoding', 'aimastery'));

alter table public.referral_earnings drop constraint if exists referral_earnings_plan_check;
alter table public.referral_earnings add constraint referral_earnings_plan_check
  check (plan in ('builder1', 'builder2', 'pro', 'vibecoding', 'aimastery'));

-- 3. cohort_schedule — widen tier CHECK, add the aimastery row (start_date
--    left null; an admin fills it in via AdminCohorts.jsx once a date is set).
alter table public.cohort_schedule drop constraint if exists cohort_schedule_tier_check;
alter table public.cohort_schedule add constraint cohort_schedule_tier_check
  check (tier in ('builder1', 'builder2', 'vibecoding', 'aimastery'));

insert into public.cohort_schedule (tier, start_date)
values ('aimastery', null)
on conflict (tier) do nothing;

-- 4. live_sessions — widen tier CHECK and RLS so AI Agent Mastery class
--    links/recordings can reuse this existing table instead of a new one.
alter table public.live_sessions drop constraint if exists live_sessions_tier_check;
alter table public.live_sessions add constraint live_sessions_tier_check
  check (tier in ('builder1', 'builder2', 'vibecoding', 'aimastery'));

drop policy if exists "Live sessions require matching active entitlement or admin" on public.live_sessions;
create policy "Live sessions require matching active entitlement or admin"
  on public.live_sessions for select
  using (
    exists (select 1 from entitlements e where e.user_id = auth.uid() and e.is_admin = true)
    or (tier = 'builder1' and exists (
      select 1 from entitlements e
      where e.user_id = auth.uid() and e.builder1_expires_at is not null and e.builder1_expires_at > now()
    ))
    or (tier = 'builder2' and exists (
      select 1 from entitlements e
      where e.user_id = auth.uid() and e.builder2_expires_at is not null and e.builder2_expires_at > now()
    ))
    or (tier = 'vibecoding' and exists (
      select 1 from entitlements e
      where e.user_id = auth.uid() and e.vibecoding_expires_at is not null and e.vibecoding_expires_at > now()
    ))
    or (tier = 'aimastery' and exists (
      select 1 from entitlements e
      where e.user_id = auth.uid() and e.aimastery_expires_at is not null and e.aimastery_expires_at > now()
    ))
  );

-- 5. admin_get_all_profiles — the Admin > Users table's data source needs
--    aimastery_expires_at to display/toggle status, same as it already
--    does for vibecoding_expires_at. Also adds has_builder1_guides /
--    has_builder2_guides: since a permanent guide_purchases purchase
--    (see guide-purchases-setup.sql) is now how NEW builder1/builder2
--    access is granted, without this the admin Users table would show
--    "None" for every paying guide-bundle customer — the exact same gap
--    usePro.js was extended to close for the customer-facing site,
--    closed here too since this function is already being rewritten.
--
--    Pre-existing drift note: the version of this function checked into
--    supabase/admin-setup.sql does NOT have vibecoding_expires_at at all —
--    confirmed via pg_get_functiondef against the live database that the
--    DEPLOYED function already includes it (added directly, some time
--    after vibecoding-setup.sql shipped, without ever being captured in a
--    checked-in migration). This statement corrects that drift by
--    reproducing the true current shape plus the new column, rather than
--    perpetuating a source file that no longer matches reality.
--
--    Postgres can't CREATE OR REPLACE a function whose RETURNS TABLE shape
--    changes — it must be dropped first. Dropping resets the function's
--    ACL to the default (EXECUTE granted to PUBLIC, and separately to
--    anon/authenticated via this project's ALTER DEFAULT PRIVILEGES), so
--    the 3-statement revoke/grant dance must be re-applied after.
drop function if exists public.admin_get_all_profiles();

create function public.admin_get_all_profiles()
returns table (
  id uuid,
  email text,
  display_name text,
  created_at timestamptz,
  builder1_expires_at timestamptz,
  builder2_expires_at timestamptz,
  vibecoding_expires_at timestamptz,
  aimastery_expires_at timestamptz,
  has_builder1_guides boolean,
  has_builder2_guides boolean,
  payment_provider text,
  is_admin boolean,
  is_byu_student boolean,
  xp integer,
  streak integer,
  completed jsonb
)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  return query
    select
      p.id, p.email, p.display_name, p.created_at,
      e.builder1_expires_at, e.builder2_expires_at, e.vibecoding_expires_at, e.aimastery_expires_at,
      exists (select 1 from guide_purchases gp where gp.user_id = p.id and gp.tier = 'builder1'),
      exists (select 1 from guide_purchases gp where gp.user_id = p.id and gp.tier = 'builder2'),
      e.payment_provider, e.is_admin, p.is_byu_student,
      coalesce(pr.xp, 0), coalesce(pr.streak, 0), coalesce(pr.completed, '[]'::jsonb)
    from profiles p
    join entitlements e on e.user_id = p.id
    left join progress pr on pr.user_id = p.id
    order by p.created_at desc;
end;
$$;

revoke execute on function public.admin_get_all_profiles() from public;
revoke execute on function public.admin_get_all_profiles() from anon;
grant execute on function public.admin_get_all_profiles() to authenticated;

-- 6. Admin RPC — exact copy of admin_set_user_vibecoding's shape, including
--    its self-check (only an existing admin may call this) and the
--    mandatory 3-statement revoke/grant dance documented in CLAUDE.md:
--    CREATE FUNCTION grants EXECUTE to PUBLIC by default, AND this
--    project's ALTER DEFAULT PRIVILEGES separately grants EXECUTE to
--    anon/authenticated — both must be revoked explicitly or the function
--    is anonymously callable over /rest/v1/rpc/ despite the internal
--    admin check.
create or replace function public.admin_set_user_aimastery(target_user_id uuid, set_active boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  update entitlements
  set aimastery_expires_at = case when set_active then now() + interval '182 days' else null end
  where user_id = target_user_id;
end;
$$;

revoke execute on function public.admin_set_user_aimastery(uuid, boolean) from public;
revoke execute on function public.admin_set_user_aimastery(uuid, boolean) from anon;
grant execute on function public.admin_set_user_aimastery(uuid, boolean) to authenticated;
