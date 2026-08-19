-- ============================================================
-- Duplicate guard for the daily news bot.
--
-- Problem this fixes: generate-news-digest runs daily with no memory of
-- previous runs. Its system prompt tells it to dedupe, but it only ever
-- sees ONE day's raw items, so a story still sitting near the top of an RSS
-- feed on day 2 gets drafted again under a slightly different headline.
-- Measured 2026-08-19: 20 of 28 rows were re-drafts of just 8 stories --
-- e.g. https://openai.com/index/previewing-ultrafast drafted three times
-- across three days, each under a different title, each approved and
-- published as its own /news/:slug page.
--
-- Fixed in two layers. This file is layer 2, the backstop:
--   1. generate-news-digest/index.ts now passes the last 14 days of covered
--      titles + urls into the prompt so the model can skip them upstream.
--   2. service_insert_news_draft (below) refuses a draft that duplicates
--      something already covered, so a prompt miss can't reach the table.
--
-- Idempotent: safe to re-run.
-- ============================================================

-- Lookback for the guard. Long enough to cover a story lingering in a feed,
-- short enough that a genuine follow-up months later still gets published.
-- Deliberately a plain constant in the function rather than a settings row:
-- one caller, and a magic number here beats a config table nobody knows about.

create or replace function public.service_insert_news_draft(
  p_slug text,
  p_title text,
  p_dek text,
  p_body_blocks jsonb,
  p_is_full_article boolean,
  p_source_name text,
  p_source_url text,
  p_department_ids text[],
  p_related_agent_slug text,
  p_related_agent_tier text,
  p_image_url text,
  p_digest_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_is_index_url boolean;
begin
  -- HTML sources have no per-item permalink: fetchSource() in
  -- generate-news-digest falls back to the source's own feed_url, so EVERY
  -- story from e.g. Anthropic's newsroom carries the same source_url.
  -- Deduping those on url would permanently block that source after its
  -- first story ever, so they fall through to the title check instead.
  select exists (
    select 1 from news_sources s
    where s.feed_url = p_source_url and s.source_type = 'html'
  ) into v_is_index_url;

  if exists (
    select 1 from news_articles a
    where a.created_at > now() - interval '14 days'
      and (
        (not v_is_index_url and a.source_url = p_source_url)
        or lower(regexp_replace(a.title, '[^a-zA-Z0-9]', '', 'g'))
           = lower(regexp_replace(p_title, '[^a-zA-Z0-9]', '', 'g'))
      )
  ) then
    -- Null, not an exception: a duplicate is an expected, uninteresting
    -- outcome of a daily run, and the caller loops over drafts one at a
    -- time. Raising would need per-draft error handling to avoid one
    -- repeat story aborting the rest of the batch.
    return null;
  end if;

  insert into news_articles (
    slug, title, dek, body_blocks, is_full_article, source_name, source_url,
    department_ids, related_agent_slug, related_agent_tier, image_url, digest_date
  ) values (
    p_slug, p_title, p_dek, p_body_blocks, p_is_full_article, p_source_name, p_source_url,
    p_department_ids, p_related_agent_slug, p_related_agent_tier, p_image_url, p_digest_date
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Supports the guard's lookback scan.
create index if not exists news_articles_source_url_recent_idx
  on public.news_articles (source_url, created_at desc);

-- CREATE OR REPLACE preserves the existing ACL, but re-stating the grants
-- keeps this file safe to run against a fresh project too. Per CLAUDE.md,
-- revoking only FROM PUBLIC is not enough on this project: ALTER DEFAULT
-- PRIVILEGES also grants EXECUTE directly to anon.
revoke execute on function public.service_insert_news_draft(text, text, text, jsonb, boolean, text, text, text[], text, text, text, date) from public;
revoke execute on function public.service_insert_news_draft(text, text, text, jsonb, boolean, text, text, text[], text, text, text, date) from anon;
revoke execute on function public.service_insert_news_draft(text, text, text, jsonb, boolean, text, text, text[], text, text, text, date) from authenticated;
