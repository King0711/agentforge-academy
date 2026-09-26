-- ============================================================================
-- Course drafts: refuse to publish a draft that is older than the live guide
-- (2026-09-26)
--
-- admin_publish_course_draft() overwrites the WHOLE live course_content row
-- with the draft. The 24 drafts in course_content_draft were last edited on
-- or before 2026-09-22, and every live guide has been fixed since (Gemini
-- model, setup/install steps, third-party service steps, code bugs - see the
-- course-content-*.sql migrations of 2026-09-25/26). Publishing any of those
-- drafts as they stand would silently put all of that back.
--
-- The guard: if the live row was updated after the draft was last edited,
-- publishing raises instead of overwriting. course_content_draft's own
-- updated_at trigger bumps the draft on every edit, so a draft that has been
-- rebuilt from the current live content publishes normally.
--
-- Same admin check, same behaviour otherwise; grants restated per CLAUDE.md
-- (CREATE OR REPLACE keeps them, this just makes the intent explicit).
-- ============================================================================

create or replace function public.admin_publish_course_draft(p_course_id integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draft course_content_draft%rowtype;
  v_live_updated timestamptz;
begin
  if not exists (select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true)
  then raise exception 'Unauthorized: Admin access required'; end if;

  select * into v_draft from course_content_draft d where d.course_id = p_course_id;
  if not found then raise exception 'No draft for course %', p_course_id; end if;

  select c.updated_at into v_live_updated from course_content c where c.course_id = p_course_id;
  if v_live_updated > v_draft.updated_at then
    raise exception 'The live guide for course % was changed at % - after this draft was last edited (%). Publishing it would undo those changes. Rebuild the draft from the live content (or discard it) first.',
      p_course_id, v_live_updated, v_draft.updated_at;
  end if;

  update course_content c
  set what_you_build = v_draft.what_you_build,
      what_you_learn = v_draft.what_you_learn,
      session        = v_draft.session,
      starter_code   = v_draft.starter_code,
      test_it_out    = v_draft.test_it_out,
      troubleshooting = v_draft.troubleshooting,
      resources      = v_draft.resources,
      tier           = v_draft.tier,
      updated_at     = now()
  where c.course_id = p_course_id;

  if not found then raise exception 'No live course_content row for course %', p_course_id; end if;

  delete from course_content_draft d where d.course_id = p_course_id;
end;
$$;

revoke execute on function public.admin_publish_course_draft(integer) from public;
revoke execute on function public.admin_publish_course_draft(integer) from anon;
grant  execute on function public.admin_publish_course_draft(integer) to authenticated;
