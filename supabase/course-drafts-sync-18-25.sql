-- ============================================================================
-- Course drafts 18-25: replace the stale 2026-09-04 drafts with the 2026-09-21
-- rewrite that is committed in the repo (2026-09-26)
--
-- supabase/course-content-drafts/18..25-*.sql (commit 66c3f77) are the "no
-- shared credits" rewrite of these guides, but they never reached the
-- database: their change_note literal has an unescaped apostrophe
-- ("student's"), so every one of them fails to parse. The database kept the
-- 2026-09-04 drafts, whose sdt_ai.py still routes through the retired
-- "AI Builder credits" gateway. Drafts 13-17 from the same commit were
-- applied by hand on 2026-09-22; these eight were not.
--
-- The files were fetched by the database itself (pg_net) from
-- raw.githubusercontent.com at that exact commit, so no content was retyped.
-- Every field is checked against the md5 of the file as parsed locally, and
-- the current drafts against the md5 of the 09-04 versions, before anything
-- is written. The 09-04 drafts are kept in
-- public.course_content_draft_backup_20260926 (RLS on, anon/authenticated
-- revoked). Drafts are admin-only and never shown to students.
--
-- The fetched responses live in net._http_response (ids 1376-1383) only for
-- pg_net's retention window, so this migration is a one-off record; to
-- re-run it, issue the same net.http_get calls first and update the ids.
-- ============================================================================

do $$
declare
  f record; resp record; v_note text := 'Option-B rewrite: real tested Python replacing paste-into-Claude prompts, dual-mode sdt_ai.py gateway (student''s own Gemini or Claude/Anthropic key, no shared credits) replacing direct Anthropic SDK calls, with a course-specific safety guard.';
begin
  if to_regclass('public.course_content_draft_backup_20260926') is not null then
    raise exception 'course_content_draft_backup_20260926 already exists - has this already run?';
  end if;
  create table public.course_content_draft_backup_20260926 as
    select * from public.course_content_draft where course_id between 18 and 25;
  alter table public.course_content_draft_backup_20260926 enable row level security;
  revoke all on public.course_content_draft_backup_20260926 from anon, authenticated;

  for f in select * from (values
    (18, 1376, '18-competitor-intelligence-monitor.sql',
     'c36d6c26a9fda37c34bd3eb62224bc6c', '7feb84270e4ea68faae5d535e4243e9a', '4d5c177038c80537f26f2bfb59fe8883', 'f9d1499c6e6d4146f27006d592c55c2c', '12b04bccff312ec45468b88baf9f70ce',
     'c36d6c26a9fda37c34bd3eb62224bc6c', '7feb84270e4ea68faae5d535e4243e9a', 'd80afac1c8e30e7c9fd6925cec811903', '53cb26c80643fbb063efd9338afcb51a', '12b04bccff312ec45468b88baf9f70ce'),
    (19, 1377, '19-code-review-agent.sql',
     '5081ae2f45fa3d350f35bec00f47d750', 'cae2bbaea7d528952583bec4113c41db', '18cf9dc27e43bcce988b3c54537d9bfb', '92a7a4733cbcddf567a80b72d2f257fb', '70ab9773305d52e80bc25c3097eea4ca',
     '5081ae2f45fa3d350f35bec00f47d750', 'cae2bbaea7d528952583bec4113c41db', 'd9da94bee71b4cd8158a7ab08d0466a0', 'cf9aeb4808ad1d5faea9e8492be4851e', '70ab9773305d52e80bc25c3097eea4ca'),
    (20, 1378, '20-hr-recruitment-screening-agent.sql',
     'e459cf6cbfb3f6ad9138dccde6b03c40', '73ed31162a6c74fbd8c22eb26f739a41', 'e2f04cddfb48a1dcfa11aed5312deffc', '404f6b38c9ff3f8589d568a10fa943a5', '8d33fc84169740e4714aa63595cc11b5',
     'e459cf6cbfb3f6ad9138dccde6b03c40', '73ed31162a6c74fbd8c22eb26f739a41', '4c4403e352d089904f396d9d55cd6afd', '8b2d113dff7d4a3c63fe838fe978da9e', '8d33fc84169740e4714aa63595cc11b5'),
    (21, 1379, '21-seo-content-writer-agent.sql',
     '9434074ec866d1babed2bc8993691edb', '710582ad5378152ae7f69913a86c240b', '5ce367a9d904f450006525189997cb77', '2b8af90bcfa58b429ff5b46709e30ce1', '8ec5227fa8e4e456b7c40cd5ce6ff249',
     '9434074ec866d1babed2bc8993691edb', '710582ad5378152ae7f69913a86c240b', 'a61e4470f482b2db1b862affc172d6c9', 'd82d36344dfe9bb6dffe270fd85782c8', '8ec5227fa8e4e456b7c40cd5ce6ff249'),
    (22, 1380, '22-financial-reporting-agent.sql',
     '96ff57ec50f1200ea9de1cfc22f11bd3', '767a00533234dfb7531716423c8cea86', 'ba750a764503d681653382a835085b3d', '6af54aa9c7d5c62dc9c13ad6f9c2cfda', '46e71be4abb9dfc1dc662b522cbca79c',
     '96ff57ec50f1200ea9de1cfc22f11bd3', '767a00533234dfb7531716423c8cea86', 'c221bfec491bca8dd0ea67b0d071269e', 'f4185b2bdac1760c2a58e139e2d62e0c', '46e71be4abb9dfc1dc662b522cbca79c'),
    (23, 1381, '23-contract-clause-extractor.sql',
     '0e4a88a477925ad72d7b4d54bcdb2e68', 'acfbcd5bc58918d88dff356b2d4f25f8', 'bdcc76c6e842d1e9c86e70fcd095d0c0', '0e20d81b2f8d7e3b31fa5503a5e6e3fb', 'ed0fabb27bbfbed0c21ff6c7525f2605',
     '0e4a88a477925ad72d7b4d54bcdb2e68', 'acfbcd5bc58918d88dff356b2d4f25f8', '80764a57584c907bd67f1912198be4d1', 'be22586684d20ef08b59de484cb7d444', 'ed0fabb27bbfbed0c21ff6c7525f2605'),
    (24, 1382, '24-product-recommendation-engine.sql',
     '7a7703c8ae05159725d7bf8fdec5d4f0', 'd4e9560c7e432ebccb08551c16c6e733', '7fb88695ea01cb7d3d0f7afb1ffe0526', '2760f550139d576b393e5ab5a2300d3b', '6c9ac1240aa48b7d2288efe75e5de3a7',
     '7a7703c8ae05159725d7bf8fdec5d4f0', 'd4e9560c7e432ebccb08551c16c6e733', 'd9fa441f94515fd45d1bc735feb4d69a', '822713605e6b98c51103ec893db5d16f', '6c9ac1240aa48b7d2288efe75e5de3a7'),
    (25, 1383, '25-sales-email-followup-agent.sql',
     '3bd402b3efe34635acf672b368cdb9c4', 'ab9726e8953f291ef6172725da78454c', '1aa2656cf348b9abdca09a5e96840a82', '905f79730f35292fa01618e9862b69ea', 'd1adb2d915a24bcf0182400f405b287e',
     '3bd402b3efe34635acf672b368cdb9c4', 'ab9726e8953f291ef6172725da78454c', 'db7a5121f3c106a43834169d7644e2b9', '360d9f752f5f89886f2e8013d16d00df', 'd1adb2d915a24bcf0182400f405b287e')
  ) v(cid, req_id, file_name, o_wyb, o_wyl, o_sess, o_ts, o_res, n_wyb, n_wyl, n_sess, n_ts, n_res) loop
    -- the draft being replaced must be the audited 09-04 version
    if not exists (select 1 from public.course_content_draft d where d.course_id = f.cid
                   and md5(coalesce(d.what_you_build, '')) = f.o_wyb and md5(d.what_you_learn::text) = f.o_wyl
                   and md5(d.session::text) = f.o_sess and md5(d.troubleshooting::text) = f.o_ts
                   and md5(d.resources::text) = f.o_res and d.tier = 'builder2') then
      raise exception 'draft % is not the audited 2026-09-04 version - nothing was changed', f.cid;
    end if;

    select r.status_code, r.content into resp from net._http_response r where r.id = f.req_id;
    if resp.status_code is distinct from 200 then
      raise exception 'fetch % for draft % is missing or failed - nothing was changed', f.req_id, f.cid;
    end if;
    if md5(split_part(resp.content, '$wyb$', 2)) <> f.n_wyb
       or md5(split_part(resp.content, '$wyl$', 2)::jsonb::text) <> f.n_wyl
       or md5(split_part(resp.content, '$sess$', 2)::jsonb::text) <> f.n_sess
       or md5(split_part(resp.content, '$tsh$', 2)::jsonb::text) <> f.n_ts
       or md5(split_part(resp.content, '$res$', 2)::jsonb::text) <> f.n_res then
      raise exception 'fetched % does not match the reviewed file - nothing was changed', f.file_name;
    end if;

    update public.course_content_draft d set
      what_you_build  = split_part(resp.content, '$wyb$', 2),
      what_you_learn  = split_part(resp.content, '$wyl$', 2)::jsonb,
      session         = split_part(resp.content, '$sess$', 2)::jsonb,
      troubleshooting = split_part(resp.content, '$tsh$', 2)::jsonb,
      resources       = split_part(resp.content, '$res$', 2)::jsonb,
      change_note     = v_note
    where d.course_id = f.cid;
  end loop;

  if (select count(*) from public.course_content_draft d where d.course_id between 18 and 25
        and d.updated_at = now() and d.change_note = v_note) <> 8 then
    raise exception 'post-check: not all eight drafts were replaced - rolling back';
  end if;
end $$;
