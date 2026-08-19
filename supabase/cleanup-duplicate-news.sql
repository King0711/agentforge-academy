-- ============================================================
-- One-off cleanup of the duplicate articles the news bot published before
-- supabase/news-dedupe-guard.sql existed.
--
-- As of 2026-08-19: 28 rows covering only 20 distinct stories. Eight
-- source_urls were drafted 2-3 times each across consecutive days, each
-- time under a different headline, because the daily run had no memory of
-- previous runs. Example: https://openai.com/index/previewing-ultrafast
-- became three separate published /news/:slug pages.
--
-- Strategy: for each duplicated source_url, KEEP the best row and mark
-- the rest 'rejected'. Rejected, not deleted:
--   * reversible — an admin can flip one back in the panel
--   * the RLS select policy is `status = 'approved'`, so rejecting is
--     enough to pull the page and drop it from the sitemap/RSS
--   * keeps the digest history intact for anything already emailed
--
-- "Earliest" is qualified: an APPROVED row always outranks a pending or
-- rejected one, and a full article outranks a digest blurb, before
-- created_at breaks the tie. A naive earliest-wins would, for the DeepMind
-- sign-language story, have kept a pending_review blurb and rejected the
-- approved article -- pulling that story off the site completely instead of
-- just deduplicating it.
--
-- SEO note: the rejected URLs will start returning 404. They're days old
-- and near-certainly unranked, and duplicate content is the worse problem;
-- but if any has picked up links, restore it and reject a sibling instead.
--
-- HTML sources are excluded for the same reason the guard excludes them:
-- fetchSource() has no per-item permalink for those, so every story from
-- e.g. Anthropic's newsroom shares one source_url and is NOT a duplicate.
--
-- Run the SELECT first, eyeball it, then run the UPDATE.
-- ============================================================

-- ── Preview: what would be rejected ─────────────────────────────────────
with ranked as (
  select
    a.id, a.title, a.slug, a.status, a.digest_date, a.source_url,
    row_number() over (
      partition by a.source_url
      order by (a.status = 'approved') desc, a.is_full_article desc, a.created_at
    ) as rn,
    count(*) over (partition by a.source_url) as group_size
  from news_articles a
  where not exists (
    select 1 from news_sources s
    where s.feed_url = a.source_url and s.source_type = 'html'
  )
)
select
  case when rn = 1 then 'KEEP' else 'REJECT' end as action,
  group_size, digest_date, status, title, slug
from ranked
where group_size > 1
order by source_url, rn;

-- ── Apply ───────────────────────────────────────────────────────────────
-- Idempotent: re-running rejects nothing new, because the surviving row in
-- each group is always rn = 1.
--
-- update news_articles
-- set status = 'rejected'
-- where id in (
--   with ranked as (
--     select
--       a.id,
--       row_number() over (
--         partition by a.source_url
--         order by (a.status = 'approved') desc, a.is_full_article desc, a.created_at
--       ) as rn,
--       count(*) over (partition by a.source_url) as group_size
--     from news_articles a
--     where not exists (
--       select 1 from news_sources s
--       where s.feed_url = a.source_url and s.source_type = 'html'
--     )
--   )
--   select id from ranked where group_size > 1 and rn > 1
-- )
-- and status <> 'rejected';
