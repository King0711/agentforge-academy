-- ============================================================================
-- 2026-10-15  Course 11 (Calendar & Task Prioritizer): remove the walkthrough
-- video (session.video) from the guide, at the founder's request.
--
-- The guide's own text never refers to the video (checked: no other "video"
-- text in the session), so dropping the key is the whole change. The result is
-- byte-identical to the 2026-10-08 session (md5 606b53c7...), which is the
-- end state asserted below.
--
-- Source of truth: supabase/course-content-drafts/11-calendar-task-prioritizer-agent.sql
-- (video block removed there too). The mp4 and poster under public/videos/ are
-- left in place; nothing links to them any more.
--
-- Guarded on the live session md5 (the 2026-10-10 version, with video.poster),
-- end state checked, one transaction, backup (RLS on, anon/authenticated
-- revoked): course_content_backup_20261015_calendar_no_video
--
-- Rollback:
--   update public.course_content c set session = b.session, updated_at = now()
--   from public.course_content_backup_20261015_calendar_no_video b
--   where c.course_id = 11 and b.course_id = 11;
-- ============================================================================

do $mig$
declare
  n int;
begin
  if to_regclass('public.course_content_backup_20261015_calendar_no_video') is not null then
    raise exception 'course_content_backup_20261015_calendar_no_video already exists - has this already run?';
  end if;
  if (select md5(session::text) from public.course_content where course_id = 11) is distinct from 'c35525f3274b4ae49149d4ca4a8e576c' then
    raise exception 'live row 11 session is not the 2026-10-10 version - nothing was changed';
  end if;

  create table public.course_content_backup_20261015_calendar_no_video as
    select * from public.course_content where course_id = 11;
  alter table public.course_content_backup_20261015_calendar_no_video enable row level security;
  revoke all on public.course_content_backup_20261015_calendar_no_video from anon, authenticated;

  update public.course_content set
    session    = session - 'video',
    updated_at = now()
  where course_id = 11;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'expected to update exactly 1 row, updated %', n; end if;

  if (select md5(session::text) from public.course_content where course_id = 11) is distinct from '606b53c731e379ece6de121c678600d1' then
    raise exception 'end state of row 11 is not what was expected - rolled back';
  end if;
  if (select session ? 'video' from public.course_content where course_id = 11) then
    raise exception 'video key still present - rolled back';
  end if;
end
$mig$;
