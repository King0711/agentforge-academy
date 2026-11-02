-- Vibe Coding: one-hour-before class reminder + same-day sign-ups join the batch
-- (2026-11-02). Apply this first, then deploy send-vibecoding-class-reminders
-- (verify_jwt = false; it checks the cron secret or an admin itself).
--
-- 1. email_log accepts the new reminder type (the constraint is an allowlist, and a
--    rejected audit row would silently break the once-per-class dedupe).
-- 2. A batch can stay joinable for a while after its first class starts
--    (vibecoding_cohorts.joinable_until). Founder decision 2026-11-02: anyone who
--    signs up on the day the first batch starts joins it instead of waiting for the
--    next one. The 2 Nov batch is joinable until the end of that day in WAT
--    (23:00 UTC). A batch with no joinable_until behaves as before (closes at its
--    start), so later batches keep the original rule unless the admin extends them.
-- 3. A service-role-only lookup of who is enrolled for a class, using the account
--    email in auth.users (never profiles.email; see CLAUDE.md), including people who
--    paid as guests and haven't confirmed their email yet.
-- 4. The cron job: every 10 minutes from 14:00 to 21:50 UTC (15:00-22:50 WAT). The
--    function only acts on a class starting within the next 65 minutes, so for the
--    usual 18:00 UTC class the 17:00 tick sends it.

begin;

alter table public.email_log drop constraint if exists email_log_email_type_check;
alter table public.email_log add constraint email_log_email_type_check check (email_type = any (array[
  'broadcast', 'winback', 'abandoned_checkout', 'cohort_reminder', 'class_reminder', 'news_digest',
  'welcome', 'lead_confirm', 'lead_drip', 'aimastery_class_reminder', 'aimastery_class_reminder_1h',
  'aimastery_onboarding', 'aimastery_schedule_correction', 'vibecoding_class_reminder_1h'
]::text[]));

alter table public.vibecoding_cohorts add column if not exists joinable_until timestamptz;

update public.vibecoding_cohorts
   set joinable_until = timestamptz '2026-11-02 23:00:00+00'
 where starts_at = timestamptz '2026-11-02 18:00:00+00';

create or replace function public.vibecoding_next_cohort() returns timestamptz
language sql stable set search_path = public as $$
  select coalesce(
    (select min(starts_at) from public.vibecoding_cohorts where coalesce(joinable_until, starts_at) > now()),
    'infinity'::timestamptz)
$$;

create or replace function public.service_get_vibecoding_reminder_candidates(p_session_id uuid)
returns table(user_id uuid, email text, display_name text)
language sql security definer set search_path = public as $$
  select e.user_id, u.email::text, p.display_name
    from public.live_sessions ls
    join public.entitlements e on e.vibecoding_cohort_start = ls.cohort_start
    join auth.users u on u.id = e.user_id
    left join public.profiles p on p.id = e.user_id
   where ls.id = p_session_id
     and ls.tier = 'vibecoding'
     and e.vibecoding_expires_at > now()
     and u.email is not null
$$;
revoke execute on function public.service_get_vibecoding_reminder_candidates(uuid) from public;
revoke execute on function public.service_get_vibecoding_reminder_candidates(uuid) from anon;
revoke execute on function public.service_get_vibecoding_reminder_candidates(uuid) from authenticated;
grant execute on function public.service_get_vibecoding_reminder_candidates(uuid) to service_role;

commit;

-- Same cron_secret vault pattern as the other reminder jobs.
select cron.schedule(
  'vibecoding-class-reminder-1h',
  '*/10 14-21 * * *',
  $$
  select net.http_post(
    url := 'https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/send-vibecoding-class-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);
