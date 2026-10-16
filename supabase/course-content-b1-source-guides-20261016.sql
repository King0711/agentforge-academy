-- ============================================================================
-- 2026-10-16  Builder 1: replace five guides with the founder's new versions
--
--   course 1  Gmail AI Triage Agent        <- "Gmail AI Triage Agent Full Build Session Guide.md"
--   course 5  Meeting Notes Formatter      <- "Build Your Meeting Notes Agent with Claude_ Beginner Guide.html"
--   course 7  Social Media Post Generator  <- "Build a Free Social Media Post Agent One-Session Guide.md"
--   course 8  Document Summarizer Agent    <- "Build Your Document Summarizer Agent (Free, No-Code Session Guide).md"
--   course 9  Lead Capture & Qualifier Bot <- "lead-qualifier-bot-guide.html"
--
-- Course 6 (Simple FAQ Chatbot) was also supplied, but the live guide already
-- matches that file (same three prompts, same steps), so it is untouched.
--
-- Source of truth for the new content: supabase/course-content-drafts/{1,5,7,8,9}-*.sql.
-- Load those into course_content_draft first, then run this file. It does what
-- admin_publish_course_draft() does, for the five courses in one transaction:
-- guarded on the live rows being the 2026-09-26 versions, backed up first
-- (RLS on, anon/authenticated revoked), end state asserted, drafts consumed.
--
-- Rollback:
--   update public.course_content c
--      set what_you_build = b.what_you_build, what_you_learn = b.what_you_learn,
--          session = b.session, starter_code = b.starter_code, test_it_out = b.test_it_out,
--          troubleshooting = b.troubleshooting, resources = b.resources, tier = b.tier,
--          updated_at = now()
--     from public.course_content_backup_20261016_b1_source_guides b
--    where c.course_id = b.course_id;
-- ============================================================================

do $mig$
declare
  v_fp   constant text := 'coalesce(what_you_build, '''') || what_you_learn::text || session::text || troubleshooting::text || resources::text';
  r      record;
  v_draft_hash text;
  v_live_hash  text;
  n int;
begin
  if to_regclass('public.course_content_backup_20261016_b1_source_guides') is not null then
    raise exception 'course_content_backup_20261016_b1_source_guides already exists - has this already run?';
  end if;

  -- the five drafts must be present, and nothing else
  if (select string_agg(course_id::text, ',' order by course_id) from public.course_content_draft) is distinct from '1,5,7,8,9' then
    raise exception 'course_content_draft must hold exactly courses 1,5,7,8,9 - nothing was changed';
  end if;

  -- the live rows must still be the 2026-09-26 versions this replaces
  if (select string_agg(course_id || ':' || md5(coalesce(what_you_build, '') || what_you_learn::text || session::text || troubleshooting::text || resources::text), ' ' order by course_id)
        from public.course_content where course_id in (1, 5, 7, 8, 9))
     is distinct from '1:609a3b34d0f5e59026c166b722f25794 5:2cca874cbc4f051225589613cd71f56f 7:ac07195896db0bc3c58995c8387b2cc7 8:43f15f923ff06e6d64bea2c79e9ad642 9:8e374ff3370a015313d710e960e76cb4'
  then
    raise exception 'live rows 1,5,7,8,9 are not the 2026-09-26 versions - nothing was changed';
  end if;

  create table public.course_content_backup_20261016_b1_source_guides as
    select * from public.course_content where course_id in (1, 5, 7, 8, 9);
  alter table public.course_content_backup_20261016_b1_source_guides enable row level security;
  revoke all on public.course_content_backup_20261016_b1_source_guides from anon, authenticated;

  for r in select * from public.course_content_draft order by course_id loop
    execute format('select md5(%s) from public.course_content_draft where course_id = $1', v_fp) into v_draft_hash using r.course_id;

    update public.course_content c
       set what_you_build  = r.what_you_build,
           what_you_learn  = r.what_you_learn,
           session         = r.session,
           starter_code    = r.starter_code,
           test_it_out     = r.test_it_out,
           troubleshooting = r.troubleshooting,
           resources       = r.resources,
           tier            = r.tier,
           updated_at      = now()
     where c.course_id = r.course_id;
    get diagnostics n = row_count;
    if n <> 1 then raise exception 'no live row for course %', r.course_id; end if;

    execute format('select md5(%s) from public.course_content where course_id = $1', v_fp) into v_live_hash using r.course_id;
    if v_live_hash is distinct from v_draft_hash then
      raise exception 'course % does not match its draft after the update', r.course_id;
    end if;

    delete from public.course_content_draft where course_id = r.course_id;
  end loop;

  if (select count(*) from public.course_content_draft) <> 0 then raise exception 'drafts were not consumed'; end if;
  if (select count(*) from public.course_content where course_id in (1, 5, 7, 8, 9) and tier = 'builder1') <> 5 then
    raise exception 'tier check failed';
  end if;
end
$mig$;
