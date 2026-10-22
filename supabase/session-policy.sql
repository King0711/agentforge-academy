-- Session lifetime + "2FA must be fresh" policy (2026-10-22).
--
-- Three problems this closes:
--   1. A Supabase session never expires on its own. The Auth settings that time-box
--      sessions or time them out for inactivity are Pro-plan only, and this project is
--      not on Pro, so the sweep below does it from the database.
--   2. admin_session_ok() (admin-mfa.sql) accepted ANY aal2 session forever: prove a
--      TOTP code once and every later token refresh stayed aal2. It now also needs the
--      TOTP entry in the JWT's `amr` claim to be recent. The `amr` timestamp is the
--      moment the code was last entered, and it is signed into the token, so it can't
--      be edited by the client.
--   3. The app let an aal1 session (password / emailed code) straight into the dashboard
--      even when the account has an authenticator. That is fixed in the frontend
--      (MfaGate); this file only supplies the numbers it uses.
--
-- Everything is tunable in public.auth_policy, no deploy needed:
--   mfa_max_age_minutes         how long a TOTP code stays good before the next one is
--                               demanded (default 8 h)
--   user_session_max_hours      hard cap on a student session (default 90 days)
--   user_session_idle_hours     a student session not refreshed for this long is ended
--                               (default 30 days)
--   admin_session_max_hours     hard cap on an admin session (default 12 h)
--   admin_session_idle_minutes  admin session not refreshed for this long is ended
--                               (default 120; keep it above the 60-minute JWT lifetime
--                               or active admins get cut off at the next refresh)
--   admin_idle_lock_minutes     the browser signs an admin out after this long without
--                               touching the page (default 30; enforced by the frontend)
--
-- "Refreshed" is when the browser last exchanged its refresh token, which happens about
-- hourly while a tab is open and not at all while it is closed, so the idle numbers are
-- accurate to roughly an hour.
--
-- ROLLOUT (ships with the sweep OFF so applying this changes nothing by itself):
--   1. apply this file
--   2. deploy the frontend (MfaGate + admin idle lock)
--   3. update public.auth_policy set sweep_enabled = true;
-- With the defaults, step 3 signs out roughly 80% of today's sessions (they are old or
-- dormant); those users log in again with an emailed code. Run
--     select public.session_policy_preview();
-- first to see exactly how many sessions it would end.
-- EMERGENCY OFF: update public.auth_policy set sweep_enabled = false;
-- Ended sessions keep working until their access token expires (up to one hour); only the
-- refresh stops. That is Supabase's design, not something this file can shorten.
--
-- The admin_session_ok() change only matters while
-- admin_security_settings.require_mfa is true (see admin-mfa.sql). That switch was still
-- false when this was written.

-- ---------- the numbers ----------
create table if not exists public.auth_policy (
  id boolean primary key default true check (id),
  sweep_enabled boolean not null default false,
  mfa_max_age_minutes integer not null default 480 check (mfa_max_age_minutes between 5 and 10080),
  user_session_max_hours integer not null default 2160 check (user_session_max_hours >= 1),
  user_session_idle_hours integer not null default 720 check (user_session_idle_hours >= 2),
  admin_session_max_hours integer not null default 12 check (admin_session_max_hours >= 1),
  admin_session_idle_minutes integer not null default 120 check (admin_session_idle_minutes >= 90),
  admin_idle_lock_minutes integer not null default 30 check (admin_idle_lock_minutes between 5 and 600),
  updated_at timestamptz not null default now()
);
insert into public.auth_policy (id) values (true) on conflict (id) do nothing;

-- Not secret: the app reads it to know when to ask for a code again. Nobody writes it
-- from the browser.
alter table public.auth_policy enable row level security;
drop policy if exists "Anyone can read the auth policy" on public.auth_policy;
create policy "Anyone can read the auth policy" on public.auth_policy for select using (true);
revoke all on public.auth_policy from anon, authenticated;
grant select on public.auth_policy to anon, authenticated;

-- ---------- was a TOTP code entered recently? ----------
-- Reads the caller's own JWT only. `amr` is ordered most recent first and each entry
-- is { method, timestamp (unix seconds) }; a session with no totp entry returns false.
create or replace function public.mfa_is_recent(p_max_minutes integer)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce((
    select max((e ->> 'timestamp')::bigint)
    from jsonb_array_elements(
      case when jsonb_typeof(auth.jwt() -> 'amr') = 'array' then auth.jwt() -> 'amr' else '[]'::jsonb end
    ) e
    where e ->> 'method' = 'totp'
  ), 0) >= extract(epoch from now())::bigint - p_max_minutes::bigint * 60;
$$;

-- ---------- admin gate: aal2 AND a recent code ----------
-- Replaces the body from admin-mfa.sql. Same signature and the same SECURITY INVOKER
-- (it runs inside policies for any role), so every admin_* function and policy that
-- already calls it picks this up with no further change. admin-mfa.sql is not
-- re-runnable after this file without undoing it.
create or replace function public.admin_session_ok()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    not coalesce((select s.require_mfa from public.admin_security_settings s where s.id), false)
    or (
      coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
      and public.mfa_is_recent(coalesce((select p.mfa_max_age_minutes from public.auth_policy p where p.id), 480))
    );
$$;

-- ---------- the sweep ----------
-- Ends (deletes) sessions past their cap or idle limit. Deleting the auth.sessions row
-- cascades to its refresh tokens, so the next refresh attempt fails and the browser
-- falls back to the login page.
create or replace function public.session_policy_victims()
returns table (session_id uuid, user_id uuid, is_admin boolean, reason text)
language sql
stable
security definer
set search_path = public, auth
as $$
  select s.id, s.user_id, coalesce(e.is_admin, false),
    case
      when s.created_at < now() - make_interval(hours => case when coalesce(e.is_admin, false) then p.admin_session_max_hours else p.user_session_max_hours end)
        then 'max_age'
      else 'idle'
    end
  from auth.sessions s
  cross join public.auth_policy p
  left join public.entitlements e on e.user_id = s.user_id
  where p.id
    and (
      s.created_at < now() - make_interval(hours => case when coalesce(e.is_admin, false) then p.admin_session_max_hours else p.user_session_max_hours end)
      or coalesce(s.refreshed_at at time zone 'utc', s.updated_at, s.created_at)
         < now() - case when coalesce(e.is_admin, false)
                     then make_interval(mins => p.admin_session_idle_minutes)
                     else make_interval(hours => p.user_session_idle_hours) end
    );
$$;

create or replace function public.enforce_session_policy()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  n integer;
begin
  if not coalesce((select p.sweep_enabled from public.auth_policy p where p.id), false) then
    return 0;
  end if;
  delete from auth.sessions where id in (select v.session_id from public.session_policy_victims() v);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Dry run: what the sweep would end right now, whether or not it is switched on.
create or replace function public.session_policy_preview()
returns table (kind text, reason text, sessions bigint)
language sql
stable
security definer
set search_path = public, auth
as $$
  select case when v.is_admin then 'admin' else 'student' end, v.reason, count(*)
  from public.session_policy_victims() v
  group by 1, 2
  order by 1, 2;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.session_policy_victims()',
    'public.enforce_session_policy()',
    'public.session_policy_preview()'
  ] loop
    execute format('revoke execute on function %s from public', fn);
    execute format('revoke execute on function %s from anon', fn);
    execute format('revoke execute on function %s from authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;

-- pg_cron is UTC. Every 10 minutes; a no-op until sweep_enabled is turned on.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.schedule('session-policy-sweep', '*/10 * * * *', 'select public.enforce_session_policy()');
  end if;
end;
$$;
