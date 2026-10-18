-- ============================================================
-- AI Agent Mastery includes 5 Builder 1 courses (2026-10-18)
--
-- The sales page promises "5 Builder 1 courses free". paystack-webhook now
-- inserts one guide_purchases row per course for every AI Agent Mastery
-- payment, under their OWN tier 'aimastery_bonus' — not 'builder1', which
-- would make the buyer a full Builder 1 owner (unlocking all 12 guides,
-- hiding the Builder 1 offer and triggering the Pro-upgrade offer).
--
-- The courses (ids 1, 5, 7, 8, 9 — the five rewritten 2026-10-16):
--   1 Gmail triage, 5 meeting notes, 7 social posts, 8 document summarizer,
--   9 lead capture. Keep AIMASTERY_BONUS_COURSE_IDS in paystack-webhook
--   in step if this list changes.
--
-- course_content RLS already admits any guide_purchases row for the
-- course_id, so no policy change is needed.
--
-- Deploy order: run this, deploy paystack-webhook, then the frontend.
-- ============================================================

begin;

alter table public.guide_purchases drop constraint if exists guide_purchases_tier_check;
alter table public.guide_purchases
  add constraint guide_purchases_tier_check
  check (tier in ('builder1', 'builder2', 'aimastery_bonus'));

-- Backfill: everyone who already bought AI Agent Mastery (a granted payment).
-- Optional — remove this block to give the bonus to new buyers only.
insert into public.guide_purchases (user_id, course_id, tier, provider_transaction_id)
select p.user_id, c.course_id, 'aimastery_bonus', 'backfill_aimastery_bonus'
from (select distinct user_id from public.payments
      where plan = 'aimastery' and user_id is not null and status like 'granted%') p
cross join (values (1), (5), (7), (8), (9)) as c(course_id)
on conflict (user_id, course_id) do nothing;

commit;
