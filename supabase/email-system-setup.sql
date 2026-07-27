-- ============================================================
-- Social Dev Technologies — Email communications system
-- Run this in Supabase: Project → SQL Editor → New query
-- (Already applied directly to the live project via migration.)
--
-- Covers: checkout_attempts, email_log, email_settings tables; admin RPCs;
-- service-role-only query functions backing the automated email jobs;
-- pg_cron schedules for win-back / abandoned-checkout / cohort-reminder.
-- ============================================================

-- 1. checkout_attempts — logs every Paystack checkout session creation so we
--    can detect "started checkout, never paid" for the abandoned-checkout
--    reminder. Marked resolved by the Paystack webhook on successful payment.
create table if not exists public.checkout_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('builder1', 'builder2', 'pro')),
  provider_reference text unique not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.checkout_attempts enable row level security;

create policy "Users can view their own checkout attempts"
  on public.checkout_attempts for select
  using (auth.uid() = user_id);
-- No client insert/update policy — only the service role (Edge Functions) writes here.

create index if not exists checkout_attempts_unresolved_idx
  on public.checkout_attempts (created_at)
  where resolved_at is null;

create index if not exists checkout_attempts_user_id_idx
  on public.checkout_attempts (user_id);

-- 2. email_log — one row per (recipient, email_type) send, used both as an
--    audit trail for the admin dashboard and as the dedup/cooldown check so
--    the same person doesn't get the same automated email every run.
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  email_type text not null check (email_type in ('broadcast', 'winback', 'abandoned_checkout', 'cohort_reminder')),
  subject text not null,
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz not null default now()
);

alter table public.email_log enable row level security;
-- No client policy at all — admins read this via the admin_get_email_log RPC
-- (SECURITY DEFINER), not a direct table policy, since it's cross-user data.

create index if not exists email_log_user_type_idx
  on public.email_log (user_id, email_type, sent_at desc);

-- 3. email_settings — a single-row admin-configurable settings table.
--    Deliberately one fixed row (id always 1) rather than a key/value table —
--    there are only a handful of knobs and a fixed row is simpler to read/write.
create table if not exists public.email_settings (
  id integer primary key default 1 check (id = 1),
  winback_inactive_days integer not null default 14,
  winback_automation_enabled boolean not null default true,
  abandoned_checkout_automation_enabled boolean not null default true,
  cohort_reminder_automation_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.email_settings enable row level security;
-- No client policy — read/write only via admin RPCs below.

insert into public.email_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists set_email_settings_updated_at on public.email_settings;
create trigger set_email_settings_updated_at
  before update on public.email_settings
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Admin RPCs — same is_admin-gated SECURITY DEFINER pattern as
-- admin-setup.sql. Every `entitlements` column is qualified with the `ent`
-- alias to avoid the ambiguous-column bug documented there.
-- ============================================================

create or replace function public.admin_get_email_settings()
returns table (
  winback_inactive_days integer,
  winback_automation_enabled boolean,
  abandoned_checkout_automation_enabled boolean,
  cohort_reminder_automation_enabled boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  return query
    select
      s.winback_inactive_days, s.winback_automation_enabled,
      s.abandoned_checkout_automation_enabled, s.cohort_reminder_automation_enabled,
      s.updated_at
    from email_settings s where s.id = 1;
end;
$$;

create or replace function public.admin_update_email_settings(
  p_winback_inactive_days integer,
  p_winback_automation_enabled boolean,
  p_abandoned_checkout_automation_enabled boolean,
  p_cohort_reminder_automation_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  update email_settings
  set
    winback_inactive_days = p_winback_inactive_days,
    winback_automation_enabled = p_winback_automation_enabled,
    abandoned_checkout_automation_enabled = p_abandoned_checkout_automation_enabled,
    cohort_reminder_automation_enabled = p_cohort_reminder_automation_enabled
  where id = 1;
end;
$$;

-- List users inactive for >= N days (by auth.users.last_sign_in_at, falling
-- back to profiles.created_at for someone who's never signed in again since
-- signup), excluding admins and excluding anyone already sent a winback
-- email within the last N days (so re-running this doesn't spam people).
create or replace function public.admin_get_inactive_users(p_days integer)
returns table (
  id uuid,
  email text,
  display_name text,
  last_active timestamptz,
  days_inactive integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  return query
    select
      p.id, p.email, p.display_name,
      coalesce(u.last_sign_in_at, p.created_at) as last_active,
      extract(day from now() - coalesce(u.last_sign_in_at, p.created_at))::integer as days_inactive
    from profiles p
    join auth.users u on u.id = p.id
    join entitlements ent2 on ent2.user_id = p.id
    where ent2.is_admin = false
      and coalesce(u.last_sign_in_at, p.created_at) < now() - (p_days || ' days')::interval
      and not exists (
        select 1 from email_log el
        where el.user_id = p.id
          and el.email_type = 'winback'
          and el.sent_at > now() - (p_days || ' days')::interval
      )
    order by last_active asc;
end;
$$;

create or replace function public.admin_get_email_log(p_limit integer default 50)
returns table (
  id uuid,
  email text,
  email_type text,
  subject text,
  sent_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  return query
    select el.id, el.email, el.email_type, el.subject, el.sent_at
    from email_log el
    order by el.sent_at desc
    limit p_limit;
end;
$$;

revoke execute on function public.admin_get_email_settings() from anon, public;
grant execute on function public.admin_get_email_settings() to authenticated;

revoke execute on function public.admin_update_email_settings(integer, boolean, boolean, boolean) from anon, public;
grant execute on function public.admin_update_email_settings(integer, boolean, boolean, boolean) to authenticated;

revoke execute on function public.admin_get_inactive_users(integer) from anon, public;
grant execute on function public.admin_get_inactive_users(integer) to authenticated;

revoke execute on function public.admin_get_email_log(integer) from anon, public;
grant execute on function public.admin_get_email_log(integer) to authenticated;

-- ============================================================
-- Service-role-only query functions backing the automated email jobs.
-- No auth.uid()/is_admin check — invoked by Edge Functions using the
-- service role key (a trusted server-side context, either a manual
-- admin-triggered send or a pg_cron scheduled run), which has no end-user
-- JWT to check against. Never grant these to anon or authenticated.
-- ============================================================

create or replace function public.service_get_inactive_users(p_days integer)
returns table (
  id uuid,
  email text,
  display_name text,
  last_active timestamptz,
  days_inactive integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      p.id, p.email, p.display_name,
      coalesce(u.last_sign_in_at, p.created_at) as last_active,
      extract(day from now() - coalesce(u.last_sign_in_at, p.created_at))::integer as days_inactive
    from profiles p
    join auth.users u on u.id = p.id
    join entitlements ent2 on ent2.user_id = p.id
    where ent2.is_admin = false
      and coalesce(u.last_sign_in_at, p.created_at) < now() - (p_days || ' days')::interval
      and not exists (
        select 1 from email_log el
        where el.user_id = p.id
          and el.email_type = 'winback'
          and el.sent_at > now() - (p_days || ' days')::interval
      )
    order by last_active asc;
end;
$$;

revoke execute on function public.service_get_inactive_users(integer) from anon, authenticated, public;

create or replace function public.service_get_abandoned_checkouts(p_hours integer default 2)
returns table (
  attempt_id uuid,
  user_id uuid,
  email text,
  display_name text,
  plan text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select ca.id, ca.user_id, p.email, p.display_name, ca.plan, ca.created_at
    from checkout_attempts ca
    join profiles p on p.id = ca.user_id
    where ca.resolved_at is null
      and ca.created_at < now() - (p_hours || ' hours')::interval
      and not exists (
        select 1 from email_log el
        where el.email_type = 'abandoned_checkout'
          and el.metadata ->> 'checkout_attempt_id' = ca.id::text
      )
    order by ca.created_at asc;
end;
$$;

revoke execute on function public.service_get_abandoned_checkouts(integer) from anon, authenticated, public;

create or replace function public.service_get_cohort_reminder_candidates(p_days_ahead integer default 3)
returns table (
  user_id uuid,
  email text,
  display_name text,
  tier text,
  start_date date
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select p.id, p.email, p.display_name, cs.tier, cs.start_date
    from cohort_schedule cs
    join entitlements ent2 on (
      (cs.tier = 'builder1' and ent2.builder1_expires_at is not null and ent2.builder1_expires_at > now())
      or (cs.tier = 'builder2' and ent2.builder2_expires_at is not null and ent2.builder2_expires_at > now())
    )
    join profiles p on p.id = ent2.user_id
    where cs.start_date is not null
      and cs.start_date between current_date and current_date + (p_days_ahead || ' days')::interval
      and not exists (
        select 1 from email_log el
        where el.user_id = p.id
          and el.email_type = 'cohort_reminder'
          and el.metadata ->> 'tier' = cs.tier
          and el.metadata ->> 'start_date' = cs.start_date::text
      );
end;
$$;

revoke execute on function public.service_get_cohort_reminder_candidates(integer) from anon, authenticated, public;

-- ============================================================
-- Scheduling — pg_cron + pg_net call the Edge Functions directly from
-- Postgres. The shared secret cron jobs send as `x-cron-secret` is stored
-- in Supabase Vault rather than in plaintext here.
--
-- IMPORTANT — manual step required: set the SAME secret value as the
-- `CRON_SECRET` Edge Function secret (Project Settings → Edge Functions →
-- Secrets) for send-winback-emails, send-abandoned-checkout-emails, and
-- send-cohort-reminder-emails. Without that, scheduled runs will always be
-- treated as unauthenticated manual requests and rejected.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Replace the placeholder below with a real generated secret before running
-- this file fresh (e.g. `openssl rand -hex 32`) — it was already generated
-- and applied directly to the live project, this file is for reference/DR.
select vault.create_secret(
  'REPLACE_WITH_YOUR_OWN_GENERATED_SECRET',
  'cron_secret',
  'Shared secret cron jobs send as x-cron-secret so scheduled email edge functions can tell a legitimate cron run from a random POST'
) where not exists (select 1 from vault.secrets where name = 'cron_secret');

select cron.schedule(
  'winback-weekly',
  '0 9 * * 1', -- Monday 09:00 UTC
  $$
  select net.http_post(
    url := 'https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/send-winback-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'abandoned-checkout-daily',
  '0 10 * * *', -- daily 10:00 UTC
  $$
  select net.http_post(
    url := 'https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/send-abandoned-checkout-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

select cron.schedule(
  'cohort-reminder-daily',
  '0 8 * * *', -- daily 08:00 UTC
  $$
  select net.http_post(
    url := 'https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/send-cohort-reminder-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
