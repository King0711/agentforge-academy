-- ============================================================
-- AI Agent Guides — permanent, guides-only access for Builder 1
-- and Builder 2 (builder1_expires_at/builder2_expires_at stay
-- exactly as they are for grandfathered subscribers — this is a
-- replacement for NEW sales, not a retroactive change).
--
-- Confirmed pricing (2026-09-22):
--   Builder 1 (all 12 guides) — N5,000
--   Builder 2 (all 13 guides) — N7,000
--   Pro (both)                — N10,000
--
-- Access granted this way is PERMANENT (no expiry), with no live
-- classes, cohort, or AI Builder credits — priced and framed like
-- buying a book, not a subscription.
--
-- Superseded design note: an earlier draft of this migration also
-- supported a single-guide-at-a-time purchase (plan 'guide') and a
-- separate 'bundle_builder1'/'bundle_builder2' plan distinct from
-- 'builder1'/'builder2'. That was dropped before ever being applied
-- to production (confirmed via live schema check — no historical
-- rows use those values) in favor of 'builder1'/'builder2'/'pro'
-- directly meaning "grant the permanent guide bundle."
-- ============================================================

-- 1. guide_purchases — one row per (user, course_id) ever purchased
--    as part of a tier bundle. A bundle purchase inserts one row per
--    course_id in that tier, all sharing the same tier and
--    provider_transaction_id, so a single Paystack payment is fully
--    traceable back to every guide it unlocked.
--
--    `tier` is stored directly (set by paystack-webhook at insert
--    time, which already knows it unambiguously) rather than derived
--    later from course_content.tier or src/data/agents.js — a third
--    "which courses belong to which tier" source would only be one
--    more place for that mapping to drift out of sync.
--
--    Operational note: if a course is ever added to an existing
--    tier's lineup, existing permanent owners of that tier do NOT
--    automatically get a guide_purchases row for the new course_id —
--    backfill one for each existing owner of that tier by hand
--    alongside adding the course_content row.
create table if not exists public.guide_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id integer not null,
  tier text not null check (tier in ('builder1', 'builder2')),
  provider_transaction_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

alter table public.guide_purchases enable row level security;

create policy "Users can view their own guide purchases"
  on public.guide_purchases for select
  using (auth.uid() = user_id);
-- No insert/update/delete client policy at all — only the
-- service-role client inside paystack-webhook writes this table,
-- same lockdown shape as `payments`/`entitlements`.

create index if not exists guide_purchases_user_idx on public.guide_purchases (user_id);

-- 2. course_content RLS — add a third way in, alongside the existing
--    two entitlement-tier checks (which stay for grandfathered
--    subscribers). A guide_purchases row for this exact course_id
--    grants access to that one row regardless of tier expiry,
--    permanently.
drop policy if exists "Tiered course content requires matching active entitlement or a" on public.course_content;

create policy "Tiered course content requires matching active entitlement or a"
  on public.course_content for select
  using (
    exists (
      select 1 from entitlements e where e.user_id = auth.uid() and e.is_admin = true
    )
    or (
      tier = 'builder1'
      and exists (
        select 1 from entitlements e
        where e.user_id = auth.uid() and e.builder1_expires_at is not null and e.builder1_expires_at > now()
      )
    )
    or (
      tier = 'builder2'
      and exists (
        select 1 from entitlements e
        where e.user_id = auth.uid() and e.builder2_expires_at is not null and e.builder2_expires_at > now()
      )
    )
    or exists (
      select 1 from guide_purchases gp
      where gp.user_id = auth.uid() and gp.course_id = course_content.course_id
    )
  );
