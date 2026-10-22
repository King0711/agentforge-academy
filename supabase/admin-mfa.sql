-- Two-step verification (TOTP) for admin accounts (2026-10-13).
--
-- Supabase MFA gives a session an "assurance level": aal1 = signed in with the
-- emailed code / password, aal2 = also proved a TOTP code from an authenticator
-- app. The JWT carries it as the `aal` claim.
--
-- This file makes the DATABASE honour that, so a stolen aal1 session can't call
-- the admin functions even if it never loads /admin:
--   * public.admin_security_settings.require_mfa  - the switch (ships OFF)
--   * public.admin_session_ok()                   - true when the switch is off
--                                                   or the caller's JWT is aal2
--   * every admin_* function, the admin-only table policies and the news-image
--     storage policies now also require admin_session_ok()
--
-- It ships with require_mfa = false, so applying it changes nothing for anyone.
-- Admins enroll an authenticator in /admin (the banner), then flip the switch:
--     update public.admin_security_settings set require_mfa = true;
-- EMERGENCY OFF (run in the Supabase SQL editor, which is not subject to it):
--     update public.admin_security_settings set require_mfa = false;
--
-- Deliberately NOT gated: the places where is_admin only means "admin can also
-- read student content" (course_content, live_sessions, vibecoding_prompts,
-- aimastery_room, has_community_membership, ai_reserve_request_core,
-- referrer_owned_plans). They grant no write power. The four Edge Functions that
-- check admin themselves (community-welcome preview, send-scholarship-approval-
-- email, send-winback-emails, whatsapp-send-reply) are separate; see CLAUDE.md.

-- ---------- the switch ----------
create table if not exists public.admin_security_settings (
  id boolean primary key default true check (id),
  require_mfa boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.admin_security_settings (id, require_mfa) values (true, false)
  on conflict (id) do nothing;

-- Not secret (the admin screen reads it to decide whether to block or nudge),
-- but nobody writes it from the browser.
alter table public.admin_security_settings enable row level security;
drop policy if exists "Anyone can read the admin security switch" on public.admin_security_settings;
create policy "Anyone can read the admin security switch"
  on public.admin_security_settings for select using (true);
revoke all on public.admin_security_settings from anon, authenticated;
grant select on public.admin_security_settings to anon, authenticated;

-- ---------- the check ----------
-- NOTE: session-policy.sql (2026-10-22) replaces the body below with a version that also
-- requires a RECENT totp code. Do not re-run this file after that one.
-- SECURITY INVOKER on purpose: it is called from policies that run as whichever
-- role queried, and it reveals nothing beyond the caller's own session level
-- and a flag the table above already exposes.
create or replace function public.admin_session_ok()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    not coalesce((select s.require_mfa from public.admin_security_settings s where s.id), false)
    or coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

-- ---------- every admin_* function ----------
-- Each one starts with an inline "is this caller an admin" check of the same
-- shape (`... ent.is_admin = true`). Add the session check next to it, then
-- prove none was missed. CREATE OR REPLACE keeps each function's grants.
do $$
declare
  r record;
  def text;
  new_def text;
  patched int := 0;
begin
  for r in
    select p.oid, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f' and p.proname like 'admin\_%'
      and p.proname <> 'admin_session_ok'
    order by p.proname
  loop
    def := pg_get_functiondef(r.oid);
    if def like '%admin_session_ok()%' then
      continue;
    end if;
    new_def := regexp_replace(def, '(\m(?:ent|ent2|e)\.is_admin = true)', '\1 and public.admin_session_ok()', 'g');
    if new_def = def then
      raise exception 'admin function % has no recognisable admin check; review it by hand', r.proname;
    end if;
    execute new_def;
    patched := patched + 1;
  end loop;
  raise notice 'patched % admin functions', patched;
end;
$$;

-- ---------- admin-only table and storage policies ----------
do $$
declare
  r record;
  new_qual text;
  new_check text;
  sql text;
begin
  for r in
    select schemaname, tablename, policyname, cmd, qual, with_check
    from pg_policies
    where (schemaname, tablename, policyname) in (
      ('public', 'ai_models', 'Only admins can read AI models'),
      ('public', 'ai_platform_settings', 'Only admins can read AI platform settings'),
      ('public', 'cohort_schedule', 'Admins can update cohort schedule'),
      ('public', 'community_messages', 'community_messages_delete'),
      ('public', 'course_content_backup_20260831', 'Only admins can read the course content backup'),
      ('public', 'course_content_draft', 'Only admins can read course content drafts'),
      ('storage', 'objects', 'Admins can delete article images'),
      ('storage', 'objects', 'Admins can replace article images'),
      ('storage', 'objects', 'Admins can upload article images')
    )
  loop
    new_qual := case when r.qual is null then null
      else replace(r.qual, '.is_admin = true)', '.is_admin = true AND public.admin_session_ok())') end;
    new_check := case when r.with_check is null then null
      else replace(r.with_check, '.is_admin = true)', '.is_admin = true AND public.admin_session_ok())') end;
    if (r.qual is not null and new_qual = r.qual) or (r.with_check is not null and new_check = r.with_check) then
      if r.qual like '%admin_session_ok%' or r.with_check like '%admin_session_ok%' then
        continue;
      end if;
      raise exception 'policy % on %.% has no recognisable admin check', r.policyname, r.schemaname, r.tablename;
    end if;
    sql := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
    if new_qual is not null then sql := sql || ' using (' || new_qual || ')'; end if;
    if new_check is not null then sql := sql || ' with check (' || new_check || ')'; end if;
    execute sql;
  end loop;
end;
$$;

-- ---------- proof: nothing slipped through ----------
do $$
declare
  missing text;
begin
  select string_agg(p.proname, ', ') into missing
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind = 'f' and p.proname like 'admin\_%'
    and p.proname <> 'admin_session_ok'
    and pg_get_functiondef(p.oid) not like '%admin_session_ok()%';
  if missing is not null then
    raise exception 'admin functions without the session check: %', missing;
  end if;
end;
$$;
