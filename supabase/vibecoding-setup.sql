-- Vibe Coding bootcamp — data model for the new live-cohort arm.
-- Run this in the Supabase SQL Editor (or via `supabase link` + CLI, per
-- CLAUDE.md's documented workflow). Adds a 4th plan ('vibecoding') alongside
-- the existing builder1/builder2/pro enum, its own gated content tables, and
-- widens the existing plan/tier CHECK constraints and live_sessions RLS to
-- recognize it. Does NOT touch course_content or its RLS — vibe coding
-- content lives entirely in its own tables, isolated from the automation
-- arm's gating.

-- 1. Entitlement column — mirrors builder1_expires_at/builder2_expires_at.
--    Same "no client write" posture as the rest of `entitlements`: only the
--    service-role webhook or an admin_* RPC ever sets this.
alter table public.entitlements
  add column if not exists vibecoding_expires_at timestamptz;

-- 2. Vibe Coding class content — one row per class (1-8), gated the same
--    way course_content is, just against vibecoding_expires_at instead of
--    the builder1/builder2 columns. No draft/staging table: the
--    course_content_draft + admin_publish_course_draft pattern exists for
--    the automation arm but is never actually invoked from the client (no
--    admin UI calls it), so it isn't worth replicating here — content is
--    inserted straight into this live table via the SQL files in
--    supabase/course-content-drafts/vibecoding-class-*.sql.
create table if not exists public.vibecoding_content (
  class_number integer primary key check (class_number between 1 and 8),
  title text,
  topics jsonb,
  session jsonb,
  assignment text,
  challenge_features jsonb,
  resources jsonb,
  updated_at timestamptz not null default now()
);

alter table public.vibecoding_content enable row level security;

create policy "Vibe Coding content requires active entitlement or admin"
  on public.vibecoding_content for select
  using (
    exists (select 1 from entitlements e where e.user_id = auth.uid() and e.is_admin = true)
    or exists (
      select 1 from entitlements e
      where e.user_id = auth.uid() and e.vibecoding_expires_at is not null and e.vibecoding_expires_at > now()
    )
  );
-- No client insert/update/delete policy — service-role/SQL only, same as course_content.

-- 3. Prompt library — not tied to any one class (the bootcamp's 8 reusable
--    prompts are reference material used throughout), so it doesn't fit
--    inside a single vibecoding_content row. Same gating as above.
create table if not exists public.vibecoding_prompts (
  id serial primary key,
  title text not null,
  prompt_text text not null,
  order_index integer not null default 0
);

alter table public.vibecoding_prompts enable row level security;

create policy "Vibe Coding prompt library requires active entitlement or admin"
  on public.vibecoding_prompts for select
  using (
    exists (select 1 from entitlements e where e.user_id = auth.uid() and e.is_admin = true)
    or exists (
      select 1 from entitlements e
      where e.user_id = auth.uid() and e.vibecoding_expires_at is not null and e.vibecoding_expires_at > now()
    )
  );

-- 4. Widen the three independent plan CHECK constraints to add 'vibecoding'.
--    Each of these is its own constraint (not a shared enum type), so all
--    three need this same drop/add pair.
alter table public.payments drop constraint if exists payments_plan_check;
alter table public.payments add constraint payments_plan_check
  check (plan in ('builder1', 'builder2', 'pro', 'vibecoding'));

alter table public.checkout_attempts drop constraint if exists checkout_attempts_plan_check;
alter table public.checkout_attempts add constraint checkout_attempts_plan_check
  check (plan in ('builder1', 'builder2', 'pro', 'vibecoding'));

alter table public.referral_earnings drop constraint if exists referral_earnings_plan_check;
alter table public.referral_earnings add constraint referral_earnings_plan_check
  check (plan in ('builder1', 'builder2', 'pro', 'vibecoding'));

-- 5. cohort_schedule — widen tier CHECK, add the vibecoding row (start_date
--    left null; an admin fills it in via AdminCohorts.jsx once a date is set).
alter table public.cohort_schedule drop constraint if exists cohort_schedule_tier_check;
alter table public.cohort_schedule add constraint cohort_schedule_tier_check
  check (tier in ('builder1', 'builder2', 'vibecoding'));

insert into public.cohort_schedule (tier, start_date)
values ('vibecoding', null)
on conflict (tier) do nothing;

-- 6. live_sessions — widen tier CHECK and RLS so Vibe Coding class
--    links/recordings can reuse this existing table instead of a new one.
alter table public.live_sessions drop constraint if exists live_sessions_tier_check;
alter table public.live_sessions add constraint live_sessions_tier_check
  check (tier in ('builder1', 'builder2', 'vibecoding'));

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
  );

-- 7. Admin RPC — mirrors admin_set_user_builder1/admin_set_user_builder2 in
--    supabase/admin-setup.sql, including its self-check (only an existing
--    admin may call this) and the mandatory 3-statement revoke/grant dance
--    documented in CLAUDE.md: CREATE FUNCTION grants EXECUTE to PUBLIC by
--    default, AND this project's ALTER DEFAULT PRIVILEGES separately grants
--    EXECUTE to anon/authenticated — both must be revoked explicitly or the
--    function is anonymously callable over /rest/v1/rpc/ despite the
--    internal admin check.
create or replace function public.admin_set_user_vibecoding(target_user_id uuid, set_active boolean)
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
  set vibecoding_expires_at = case when set_active then now() + interval '182 days' else null end
  where user_id = target_user_id;
end;
$$;

revoke execute on function public.admin_set_user_vibecoding(uuid, boolean) from public;
revoke execute on function public.admin_set_user_vibecoding(uuid, boolean) from anon;
grant execute on function public.admin_set_user_vibecoding(uuid, boolean) to authenticated;
