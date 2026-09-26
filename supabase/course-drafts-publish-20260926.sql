-- ============================================================================
-- Publish the 24 rewritten guides (2026-09-26)
--
-- Guides 1-3 and 5-25 become the "real tested Python" rewrite kept in
-- supabase/course-content-drafts/, after the fixes in commit 88aeced (current
-- sdt_ai.py, setup steps, service steps, code fixes, no credits - students use
-- their own Gemini or Claude key). Guide 4 is not touched.
--
-- The files were fetched by the database itself (pg_net) from
-- raw.githubusercontent.com at that exact commit; every field is checked
-- against the md5 of the reviewed file before anything is written, and the
-- drafts must still be exactly the versions the fixes were made from.
--
-- Same effect as admin_publish_course_draft() for each draft (live row gets
-- the draft's columns and tier, then the draft is deleted), done in one
-- transaction. Backups (RLS on, anon/authenticated revoked):
--   course_content_backup_20260926_publish        - the live rows it replaces
--   course_content_draft_backup_20260926_publish  - the drafts as they were
--
-- The fetched responses live in net._http_response (ids 1385-1408) only for
-- pg_net's retention window, so this is a one-off record; to re-run it, issue
-- the same net.http_get calls first and update the ids.
-- ============================================================================

do $$
declare
  f record; resp record; n int := 0;
begin
  if to_regclass('public.course_content_backup_20260926_publish') is not null then
    raise exception 'course_content_backup_20260926_publish already exists - has this already run?';
  end if;

  if (select string_agg(d.course_id || ':' || md5(coalesce(d.what_you_build, '') || d.what_you_learn::text || d.session::text
                        || d.troubleshooting::text || d.resources::text), ' ' order by d.course_id)
      from public.course_content_draft d)
     is distinct from '1:cef41359fe435949ce9e08835217493a 2:65d3ba2d6b8686bbc47b8d6117ed3a49 3:5eef31cbb2fa0eacc53ed5fbaa023535 5:9c45ba6dc52705de57dd56d8e10a507a 6:a27ce3087b8379b7b82469e4b839a411 7:d204aa47ec7dae4ca86ee885e7750b05 8:2f822471b1163c1f8950c0d4a30c7226 9:f41c78390b9c890e54d3f3016e521f89 10:bd13b227f19b64e2028531eb372b1400 11:c32078eeb9562aad9358899f7d2c4628 12:d67d80118b580263f8cdb4ef9d19f7db 13:e4b4e26491d994d4c72b50747175ec5f 14:b366f06df51c2483f86f325cbaf62185 15:42077e8b33c40d752a0b510ef836c479 16:de298a16ec9a58903039b8760ab13fc5 17:6dfd14f3f494133666837d2aa3504fb1 18:5d38077a4435dea7f209af7e2fe7cf3f 19:5c602038c7fec93dab6fb85041cf42eb 20:bddea2d5a5cb9122d6d0e521fb072635 21:3b25346cc310e3a0fb776cd8b81162d0 22:9ca5d7a82c222436703afa548600a71c 23:d17f8c34d1f0c7b4c0f928557c4121e0 24:e3237016b39e4bd651d1650de9321360 25:9bda200660e0be0920d2f011ed2ac68f' then
    raise exception 'the drafts are not the reviewed versions the fixes were made from - nothing was changed';
  end if;

  create table public.course_content_backup_20260926_publish as
    select * from public.course_content where course_id in (1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25);
  alter table public.course_content_backup_20260926_publish enable row level security;
  revoke all on public.course_content_backup_20260926_publish from anon, authenticated;

  create table public.course_content_draft_backup_20260926_publish as
    select * from public.course_content_draft;
  alter table public.course_content_draft_backup_20260926_publish enable row level security;
  revoke all on public.course_content_draft_backup_20260926_publish from anon, authenticated;

  for f in select * from (values
    (1, 1385, '1-gmail-ai-triage-agent.sql', 'builder1', '83a4bbabca073743544f05d75c25e47f', '4392697f650caf1c06c4b575a0e2e8bb', '52c6644789dfa9edfc57accc11379fc5', '692ed15d9bd77fc5d33f3da1920f623d', 'b48326c590d245f616e053f29d15fa93'),
    (2, 1386, '2-whatsapp-auto-reply-bot.sql', 'builder1', 'c17731ec8f7d11bcc2c4d4f9266a4c18', '07b81f45d8ed2509609bcec904af0fea', '21641baa0799e349db06da92e17a9590', 'aabc128c384e4cc98d8b29477e539460', '250e16ce06cb3bbc6d60cb37fc2866f9'),
    (3, 1387, '3-slack-morning-briefing-bot.sql', 'builder1', 'cde01652d32e4349012958d843847678', '467cf140f3e980e73e0c1dd37559da4d', 'fcc86a5ca60f6a664a3f3bc5c1e6520d', '5aa967028f69ff6f7d50a79bf99d7e80', 'af8cc8e9620eeee186c0ab38d6c861dc'),
    (5, 1388, '5-meeting-notes-formatter-agent.sql', 'builder1', 'fd93f863ae4cde74b7ca60b745fddcdf', 'df20c3f1328924bc68ccbb6867c0ba4c', '16bf5f57703888f336545608ecf6c9e2', '4e8d00f7836df567d7914a576d415d28', 'd7e9338a1d7a8a75485c60d96c351c9d'),
    (6, 1389, '6-simple-faq-chatbot.sql', 'builder1', '0a9348aee82511ca7b7361c27cc890e4', '4c9d7a1f89fdeb55d312b3241cf6f740', '679cd74bbcc7ebee6ddf98163835833e', '9f04beaf0d8e8e243810f4bec27d44f6', '37262709334a2ceb430c2f38554bbc2d'),
    (7, 1390, '7-social-media-post-generator.sql', 'builder1', 'd23196b7c7207202625ad66c129308dc', 'cea6f8b82280ef19bb2019d37c85d028', '2a07d70b70fd0df7e3c464da58d490cb', 'b467c53e4e713daea756c20985f9aed9', 'c7120b1da0b7eb5cc6acb28e4b5bdc28'),
    (8, 1391, '8-document-summarizer-agent.sql', 'builder1', '1942d06424ca7a109be5acb97f4e2f80', '126306ff1c9e626a43dc8a2562e0086f', '745d9f62901dadd25ba7cd7ffc92622c', '9946cba8a452e91c1fa410ddbc51fbe2', 'e4a3dd1c240b6ac61b164dbf197b642e'),
    (9, 1392, '9-lead-capture-qualifier-bot.sql', 'builder1', '28a0095fc4492c2bad70db1baf24bee9', '9310980166685f5229abc0f826136e69', 'd8e2eec3a17376dfb70ce78ffaa55153', 'f600cd41e5400672e780432f6d6924a9', '5507600ee2976177f441eb8189400eac'),
    (10, 1393, '10-price-competitor-monitor-agent.sql', 'builder1', 'a146fcb0a8e54f465805add4c3bedd8b', '90599fbadc6d0fa5b84f7af387c3a747', 'ef3ce4ca78067d25adbbebbc7d73758e', '6e1d8db7d6fb0134592a96db227d55a6', 'a5a5152d32b8d0806bcbe9bc18267377'),
    (11, 1394, '11-calendar-task-prioritizer-agent.sql', 'builder1', 'e4756026f8db9b0b9907730d9fb659f7', 'bdd9a6c9553758b4d45c8389db7076da', 'f9237f7926779b2556d5b2a208a96757', 'bda1c83c462461d079fe3b1c906843dc', '59e4b94c2a5414b4320e05ba46d82d16'),
    (12, 1395, '12-basic-data-extractor-agent.sql', 'builder1', '38bf535948e4e53e0b1c323ede93e720', '3e61ec3ca9fcf84550c51ab8f1834cd1', '09fc45486638dcf2681e915251becbca', 'eea3b42f36f757ee9de29796d04afe25', 'b4730aa44a55ec2bd440ce49b9c1f9ac'),
    (13, 1396, '13-web-research-agent.sql', 'builder2', '6adbcaa8b65ab625bf921d3437170001', '2b588b4be0ac7a1979967557927ac8fa', '7027fafd4ac861069df157fdb5d8ced4', '4a0120043ee48e1d90bb0698ea50d92b', '8599adcf5a9a6b40d6d1c6c3a94b7a95'),
    (14, 1397, '14-crm-lead-followup-agent.sql', 'builder2', '0f49d1947b888547022d956563e5b4b7', '75a7f8370d2d921da19d0a834ee7674f', '7871cc9bd5d475ca0dc2e246f4099b1e', '4f2db91e03f5a18c38946bcc85a98bfb', '43763e0643be78db3ca83853ff8110ef'),
    (15, 1398, '15-linkedin-content-creator-agent.sql', 'builder2', '7f531d7baf86a31656f97d2204b37752', '76cd82499285ff70e69d391720f2bea1', 'c14a0db266cf7c5bcb926fdedb25a38b', '0185d92f0a537b899028bc3c21204819', 'c91fd8d2226432c0767573f164568db8'),
    (16, 1399, '16-customer-support-rag-bot.sql', 'builder2', 'b231faa286b091ae1aab122d6fdafae2', '406ba99d1f1ddcacbb0944e13a33201d', '93f329b527bcc1103fa14ae5436f9816', 'c8b6f66cb08de730f3fa6831c622576f', 'd0778daa25b92cba4d0f6cd140a35321'),
    (17, 1400, '17-invoice-processing-agent.sql', 'builder2', 'ab984a22265ccf2e4366f060a6afcb98', '3e79f6550fec25cf30acb4d3576ae28f', 'ad7753fff37870ff47d4ff1459dbba65', 'e78ffe2827c962477344ad9326c1d2d8', 'c1b8bfb09f732f401130dc5f823faf37'),
    (18, 1401, '18-competitor-intelligence-monitor.sql', 'builder2', 'c36d6c26a9fda37c34bd3eb62224bc6c', 'd0e09f87d3c61fdaaabdf1d0fc7cb53d', '8186d121966feff414d5c5ce53901db0', '3dc94898984101aed11b46b86e4a78bb', 'baa30fc8fc7ed9c094d0d6d370d5e8c6'),
    (19, 1402, '19-code-review-agent.sql', 'builder2', '5081ae2f45fa3d350f35bec00f47d750', '217c17853bdb955c45944b4c3173f01f', 'f8ab6064ab6cd44d88bed1df1b8a408c', 'e9607444c13797fbd37314fca196cfc4', '2ed762dc159e0ff6ab92f7ffb93900f5'),
    (20, 1403, '20-hr-recruitment-screening-agent.sql', 'builder2', 'e459cf6cbfb3f6ad9138dccde6b03c40', '70112080649cb6d6f01f301394481e2f', '53fe6a1a478b35f4a0e70ed1af984950', '4f6fdc40944bb1dcd4cc714ce2207516', '4000c83c5b1bac8e3116fef80bf11f6e'),
    (21, 1404, '21-seo-content-writer-agent.sql', 'builder2', '9434074ec866d1babed2bc8993691edb', '4f8bdefc67366c16a2a8c60023ea2003', 'd877a2291dd65ae953cf6109c9949dbe', 'f17da9aa2b4d81e3efb6b533f61445b5', '8fa2b0eb5aea10b23f954962fb906b08'),
    (22, 1405, '22-financial-reporting-agent.sql', 'builder2', '96ff57ec50f1200ea9de1cfc22f11bd3', '17a897ac7be90b41d1fd7e971fc48c7e', 'a67b4b0a16a8ffc9f3a2eff2117931a7', 'f52fd463dd3d0f6c8e5a651a231df6c0', 'f12be5e31801ed2adfa7949f7f77b604'),
    (23, 1406, '23-contract-clause-extractor.sql', 'builder2', '0e4a88a477925ad72d7b4d54bcdb2e68', 'f5868eaa0c5b09de66a4738c6979913d', '546e8061cda88bb3297c22cba1845e99', 'acdc6e44004def96edd6f0a8d47d6eed', '8cc9f37eb09ed280fe69ff99ec62461e'),
    (24, 1407, '24-product-recommendation-engine.sql', 'builder2', '7a7703c8ae05159725d7bf8fdec5d4f0', 'b0a25392875f4ba66d16d532c073983a', 'c0720c84b64141019d6fe55ffd4a3044', '53ab59990141202564ca63d6c50a2c1f', '8b513022e2d7f37b85005727318e51f3'),
    (25, 1408, '25-sales-email-followup-agent.sql', 'builder2', '3bd402b3efe34635acf672b368cdb9c4', 'f01990152cdf67833c4420d54741aa94', '74d50afd8c55b424b987886010f858e0', '05d9c802d1a5ca39e5f6cabba6fc4f5d', '9070f819f73df9dfb882e29feb8076bb')
  ) v(cid, req_id, file_name, tier, wyb, wyl, sess, tsh, res) loop
    select r.status_code, r.content into resp from net._http_response r where r.id = f.req_id;
    if resp.status_code is distinct from 200 then
      raise exception 'fetch % for guide % is missing or failed - nothing was changed', f.req_id, f.cid;
    end if;
    if md5(split_part(resp.content, '$wyb$', 2)) <> f.wyb
       or md5(split_part(resp.content, '$wyl$', 2)) <> f.wyl
       or md5(split_part(resp.content, '$sess$', 2)) <> f.sess
       or md5(split_part(resp.content, '$tsh$', 2)) <> f.tsh
       or md5(split_part(resp.content, '$res$', 2)) <> f.res then
      raise exception 'fetched % does not match the reviewed file - nothing was changed', f.file_name;
    end if;

    update public.course_content c set
      what_you_build  = split_part(resp.content, '$wyb$', 2),
      what_you_learn  = split_part(resp.content, '$wyl$', 2)::jsonb,
      session         = split_part(resp.content, '$sess$', 2)::jsonb,
      starter_code    = null,
      test_it_out     = null,
      troubleshooting = split_part(resp.content, '$tsh$', 2)::jsonb,
      resources       = split_part(resp.content, '$res$', 2)::jsonb,
      tier            = f.tier,
      updated_at      = now()
    where c.course_id = f.cid;
    if not found then
      raise exception 'no live course_content row for guide % - nothing was changed', f.cid;
    end if;
    n := n + 1;
  end loop;
  if n <> 24 then
    raise exception 'post-check: % guides published, expected 24 - rolling back', n;
  end if;

  delete from public.course_content_draft where course_id in (1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25);

  if exists (select 1 from public.course_content_draft) then
    raise exception 'post-check: drafts left behind - rolling back';
  end if;
  if (select count(*) from public.course_content c where c.course_id in (1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25) and c.updated_at = now()
        and c.session::text like '%gemini-flash-latest%' and c.session::text like '%x-goog-api-key%'
        and c.session::text not like '%gemini-2.5-flash%' and c.session::text not like '%gemini-3.7-flash%'
        and c.session::text not like '%AI Builder%') <> 24 then
    raise exception 'post-check: not every published guide carries the new sdt_ai.py - rolling back';
  end if;
end $$;
