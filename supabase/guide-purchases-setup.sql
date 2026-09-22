-- ============================================================
-- A-la-carte guide purchases — buy one guide, or a full Builder
-- tier's guides as a discounted bundle, without a 6-month
-- subscription-style tier purchase (builder1_expires_at /
-- builder2_expires_at stay exactly as they are — this is a
-- separate, additive access path, not a replacement).
--
-- Confirmed pricing (2026-09-19):
--   Builder 1 guide  — N1,999   | Builder 1 bundle (all 12) — N14,000
--   Builder 2 guide  — N3,999   | Builder 2 bundle (all 13) — N19,999
--
-- Access granted this way is PERMANENT (no expiry) — a one-time
-- purchase of a single guide or a bundle is priced and framed like
-- buying a book, not renting a subscription. This deliberately
-- differs from the 6-month builder1_expires_at/builder2_expires_at
-- tiers, which also include AI Builder credits and cohort/live
-- perks that a-la-carte buyers are not paying for.
-- ============================================================

-- 1. guide_purchases — one row per (user, course_id) ever purchased
--    individually or as part of a bundle. A bundle purchase inserts
--    one row per course_id in that tier, all sharing the same
--    provider_transaction_id, so a single Paystack payment is fully
--    traceable back to every guide it unlocked.
create table if not exists public.guide_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id integer not null,
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

-- 2. Widen the three independent plan CHECK constraints to add 'guide' and
--    the two bundle plans — same three tables vibecoding-setup.sql widened
--    when it added 'vibecoding' (each is its own constraint, not a shared
--    enum type, so all three need this same drop/add pair):
--      - payments: paystack-webhook's insert (uncaught — not wrapped in a
--        try/catch like the other writes below it) would crash mid-webhook
--        on every single guide/bundle sale, right after guide_purchases was
--        already granted — leaving the entitlement correctly given but the
--        payment forever unlogged and the webhook stuck retrying.
--      - checkout_attempts: create-paystack-checkout's best-effort insert
--        (silently swallowed on failure) would otherwise just never log a
--        row, quietly breaking abandoned-checkout reminders for this path.
--      - referral_earnings: paystack-webhook's best-effort insert would
--        otherwise silently drop the referrer's payout for anyone referred
--        who buys a guide/bundle instead of a tier.
alter table public.payments drop constraint if exists payments_plan_check;
alter table public.payments add constraint payments_plan_check
  check (plan = any (array['builder1', 'builder2', 'pro', 'vibecoding', 'guide', 'bundle_builder1', 'bundle_builder2']));

alter table public.checkout_attempts drop constraint if exists checkout_attempts_plan_check;
alter table public.checkout_attempts add constraint checkout_attempts_plan_check
  check (plan = any (array['builder1', 'builder2', 'pro', 'vibecoding', 'guide', 'bundle_builder1', 'bundle_builder2']));

alter table public.referral_earnings drop constraint if exists referral_earnings_plan_check;
alter table public.referral_earnings add constraint referral_earnings_plan_check
  check (plan = any (array['builder1', 'builder2', 'pro', 'vibecoding', 'guide', 'bundle_builder1', 'bundle_builder2']));

-- 3. course_content RLS — add a third way in, alongside the existing
--    two entitlement-tier checks. A guide_purchases row for this
--    exact course_id grants access to that one row regardless of
--    tier expiry, permanently.
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
