-- ============================================================
-- Notification system — in-app bell + email class reminders.
-- Covers: notifications table; service_get_class_reminder_candidates and
-- admin_send_notification RPCs; a new email_settings automation toggle;
-- widening email_log's type check; the class-reminder pg_cron schedule.
-- Mirrors the structure/conventions of email-system-setup.sql and
-- admin-setup.sql — same RLS style, same SECURITY DEFINER admin-check
-- pattern, same service-role-only RPC lockdown, same cron wiring.
-- Already run once against production (qkrfpuckvymjpewcszgs); this file is
-- the checked-in source of truth / disaster-recovery reference.
-- ============================================================

-- 1. notifications — one row per (user, notification). `related_id` is an
--    optional dedup key (e.g. a live_sessions.id for a class reminder) so
--    the same event never notifies the same student twice, even if the
--    producer runs more than once for the same window.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('class_reminder', 'announcement')),
  title text not null,
  body text not null,
  link text,
  related_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can mark their own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- No insert/delete policy for clients — same lockdown as `entitlements`.
-- Rows are only ever created via the two SECURITY DEFINER paths below
-- (the class-reminder Edge Function using the service-role key, or the
-- admin_send_notification RPC), never directly by a student's own client.

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- Dedup key: an insert with `on conflict (user_id, type, related_id) where
-- related_id is not null do nothing` is both the "have I already notified
-- this person about this thing" check AND the write, in one atomic step.
create unique index if not exists notifications_dedup_idx
  on public.notifications (user_id, type, related_id)
  where related_id is not null;

-- 2. service_get_class_reminder_candidates — service-role only (called from
--    the send-class-reminder-emails Edge Function using the service-role
--    key, a trusted server context with no end-user JWT — same reasoning
--    as service_get_cohort_reminder_candidates in email-system-setup.sql).
--    Finds students whose active tier has a live_sessions row starting
--    within the window who don't already have a class_reminder notification
--    for that session.
create or replace function public.service_get_class_reminder_candidates(p_hours_ahead integer default 24)
returns table (
  user_id uuid,
  email text,
  display_name text,
  session_id uuid,
  tier text,
  title text,
  session_date timestamptz,
  join_link text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.email,
    p.display_name,
    ls.id,
    ls.tier,
    ls.title,
    ls.session_date,
    ls.join_link
  from live_sessions ls
  join profiles p on true
  join entitlements ent on ent.user_id = p.id
  where
    ls.session_date > now()
    and ls.session_date <= now() + (p_hours_ahead || ' hours')::interval
    and p.email is not null
    and (
      (ls.tier = 'builder1' and ent.builder1_expires_at > now())
      or (ls.tier = 'builder2' and ent.builder2_expires_at > now())
    )
    and not exists (
      select 1 from notifications n
      where n.user_id = p.id and n.type = 'class_reminder' and n.related_id = ls.id
    );
$$;

revoke execute on function public.service_get_class_reminder_candidates(integer) from anon, authenticated, public;

-- 3. admin_send_notification — admin-gated, same self-check pattern as every
--    admin_* RPC in admin-setup.sql. Creates in-app notifications for a
--    segment (mirrors send-broadcast-email's segment resolution) or, if
--    p_recipient_emails is given, exactly those addresses instead — the
--    same "custom recipients" escape hatch the broadcast composer has,
--    useful both for a real targeted ping and for safe testing.
create or replace function public.admin_send_notification(
  p_title text,
  p_body text,
  p_link text default null,
  p_segment text default 'all',
  p_recipient_emails text[] default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not exists (
    select 1 from entitlements ent where ent.user_id = auth.uid() and ent.is_admin = true
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  if p_recipient_emails is not null and array_length(p_recipient_emails, 1) > 0 then
    insert into notifications (user_id, type, title, body, link)
    select p.id, 'announcement', p_title, p_body, p_link
    from profiles p
    where p.email = any (p_recipient_emails);
  else
    if p_segment not in ('all', 'builder1', 'builder2', 'pro') then
      raise exception 'Invalid segment';
    end if;

    insert into notifications (user_id, type, title, body, link)
    select p.id, 'announcement', p_title, p_body, p_link
    from profiles p
    join entitlements ent on ent.user_id = p.id
    where
      case p_segment
        when 'all' then true
        when 'builder1' then ent.builder1_expires_at > now()
        when 'builder2' then ent.builder2_expires_at > now()
        when 'pro' then ent.builder1_expires_at > now() and ent.builder2_expires_at > now()
      end;
  end if;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.admin_send_notification(text, text, text, text, text[]) from anon, public;
grant execute on function public.admin_send_notification(text, text, text, text, text[]) to authenticated;

-- 4. email_settings — add the fourth automation toggle, same pattern as the
--    existing three (winback/abandoned_checkout/cohort_reminder). Defaults
--    on since this was explicitly requested, but still admin-controllable.
alter table public.email_settings
  add column if not exists class_reminder_automation_enabled boolean not null default true;

-- admin_update_email_settings needs the new toggle threaded through it too.
-- Postgres treats a different parameter list as a distinct overload rather
-- than a true replacement, so the old 4-arg version is dropped first —
-- otherwise both signatures would linger and the admin panel's single RPC
-- call would resolve ambiguously.
drop function if exists public.admin_update_email_settings(integer, boolean, boolean, boolean);

create or replace function public.admin_update_email_settings(
  p_winback_inactive_days integer,
  p_winback_automation_enabled boolean,
  p_abandoned_checkout_automation_enabled boolean,
  p_cohort_reminder_automation_enabled boolean,
  p_class_reminder_automation_enabled boolean
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
    cohort_reminder_automation_enabled = p_cohort_reminder_automation_enabled,
    class_reminder_automation_enabled = p_class_reminder_automation_enabled
  where id = 1;
end;
$$;

revoke execute on function public.admin_update_email_settings(integer, boolean, boolean, boolean, boolean) from anon, public;
grant execute on function public.admin_update_email_settings(integer, boolean, boolean, boolean, boolean) to authenticated;

-- admin_get_email_settings similarly needs the new column added to its
-- return shape. `create or replace` can't change an existing function's
-- return type (including a `returns table` column list), so this one is
-- dropped and recreated too.
drop function if exists public.admin_get_email_settings();

create or replace function public.admin_get_email_settings()
returns table (
  winback_inactive_days integer,
  winback_automation_enabled boolean,
  abandoned_checkout_automation_enabled boolean,
  cohort_reminder_automation_enabled boolean,
  class_reminder_automation_enabled boolean,
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
      s.class_reminder_automation_enabled, s.updated_at
    from email_settings s where s.id = 1;
end;
$$;

revoke execute on function public.admin_get_email_settings() from anon, public;
grant execute on function public.admin_get_email_settings() to authenticated;

-- 5. email_log — widen the type check so class-reminder sends show up in
--    the existing admin "Recent sends" log for free.
alter table public.email_log drop constraint if exists email_log_email_type_check;
alter table public.email_log add constraint email_log_email_type_check
  check (email_type in ('broadcast', 'winback', 'abandoned_checkout', 'cohort_reminder', 'class_reminder'));

-- 6. Scheduling — same pg_cron + pg_net + vault-secret wiring as the three
--    jobs at the bottom of email-system-setup.sql (extensions and the
--    cron_secret vault entry already exist from that file; not repeated
--    here). Hourly is safe because of the dedup index above — it's not a
--    race, just "notify once, whenever the hourly tick first sees you
--    inside the 24h window."
select cron.schedule(
  'class-reminder-hourly',
  '0 * * * *', -- hourly, on the hour
  $$
  select net.http_post(
    url := 'https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/send-class-reminder-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
