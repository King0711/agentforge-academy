-- Weekly AI Agent Mastery class reminder (2026-09-29). Fires every Thursday at
-- 09:00 UTC (10:00 WAT), nine hours before that week's 7 PM WAT cohort start.
-- The function itself re-checks that a cohort starts within 24h, so a
-- misfire on another day is a harmless no-op, and it dedups per cohort via
-- email_log, so a retry never double-sends.
-- Same cron_secret vault pattern as the other reminder jobs.
select cron.schedule(
  'aimastery-class-reminder-weekly',
  '0 9 * * 4',
  $$
  select net.http_post(
    url := 'https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/send-aimastery-class-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);

-- One-hour-before reminder (added 2026-09-29): Thursdays 17:00 UTC (18:00 WAT),
-- one hour before the 19:00 WAT start. Same function; it picks the short
-- "starts in 1 hour" email when the start is within 90 minutes.
select cron.schedule(
  'aimastery-class-reminder-1h-weekly',
  '0 17 * * 4',
  $$
  select net.http_post(
    url := 'https://qkrfpuckvymjpewcszgs.supabase.co/functions/v1/send-aimastery-class-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    )
  );
  $$
);

-- Room-open job (job 17, 'aimastery-room-open-before-class'): Thu/Fri/Sat 17:45
-- UTC (18:45 WAT) it sets aimastery_room.join_enabled = true so the dashboard's
-- Join class buttons unlock before class. Changed 2026-10-15 (there was no class
-- on Fri 16 Oct, and the next cohort starts Thu 22 Oct): it now does nothing
-- before 2026-10-22 08:00 UTC, and join_enabled was set back to false by hand.
-- The date guard is harmless afterwards and can be dropped:
--   select cron.alter_job(17, command := $c$
--     update public.aimastery_room set join_enabled = true, updated_at = now() where id = 1;
--   $c$);
