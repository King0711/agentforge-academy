-- Vibe Coding: isolate students by batch (2026-10-14).
--
-- Same model as AI Agent Mastery (see aimastery-cohort-strict.sql), but Vibe Coding
-- runs as discrete batches (4 weeks, 8 classes) whose start date the admin sets in
-- cohort_schedule, not as a weekly rolling cohort. Founder decision: someone who
-- pays after a batch has started joins the NEXT batch.
--
--   * vibecoding_cohorts      one row per batch (starts_at = start date, 18:00 UTC = 7 PM WAT)
--   * entitlements.vibecoding_cohort_start   the batch a student belongs to
--   * live_sessions.cohort_start             the batch a session belongs to
--   * a student only ever reads sessions (recordings, passcodes, join links, resources)
--     whose cohort_start equals their own.
--
-- Student with no upcoming batch scheduled yet: assigned 'infinity' ("pending"). That
-- matches no session, so they see nothing until the admin sets the next start date in
-- cohort_schedule, at which point pending students move onto it automatically.

create table if not exists public.vibecoding_cohorts (
  starts_at timestamptz primary key
);
alter table public.vibecoding_cohorts enable row level security;
revoke all on public.vibecoding_cohorts from anon, authenticated;

alter table public.entitlements add column if not exists vibecoding_cohort_start timestamptz;

-- Next batch that has not started yet, or 'infinity' (pending) if none is scheduled.
create or replace function public.vibecoding_next_cohort() returns timestamptz
language sql stable set search_path = public as $$
  select coalesce((select min(starts_at) from public.vibecoding_cohorts where starts_at > now()),
                  'infinity'::timestamptz)
$$;

-- Batch a class belongs to: the latest batch that has begun by that date (a few
-- hours of slack for same-day classes); classes dated before the first batch fall
-- into the first batch.
create or replace function public.vibecoding_cohort_of_class(p_at timestamptz) returns timestamptz
language sql stable set search_path = public as $$
  select coalesce((select max(starts_at) from public.vibecoding_cohorts where starts_at <= p_at + interval '6 hours'),
                  (select min(starts_at) from public.vibecoding_cohorts))
$$;

-- Seed from the batch the admin has already scheduled.
insert into public.vibecoding_cohorts (starts_at)
select (start_date::timestamp + interval '18 hours') at time zone 'UTC'
  from public.cohort_schedule where tier = 'vibecoding' and start_date is not null
on conflict do nothing;

-- Student -> batch, assigned when access is granted or renewed after expiry.
create or replace function public.entitlements_set_vibecoding_cohort() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if NEW.vibecoding_expires_at is null then return NEW; end if;
  if TG_OP = 'INSERT' then
    if NEW.vibecoding_cohort_start is null then NEW.vibecoding_cohort_start := public.vibecoding_next_cohort(); end if;
  elsif NEW.vibecoding_expires_at is distinct from OLD.vibecoding_expires_at
        and (OLD.vibecoding_expires_at is null or OLD.vibecoding_expires_at <= now())
        and NEW.vibecoding_cohort_start is not distinct from OLD.vibecoding_cohort_start then
    NEW.vibecoding_cohort_start := public.vibecoding_next_cohort();
  end if;
  return NEW;
end; $$;
drop trigger if exists set_vibecoding_cohort on public.entitlements;
create trigger set_vibecoding_cohort before insert or update on public.entitlements
  for each row execute function public.entitlements_set_vibecoding_cohort();

-- Session -> batch (aimastery logic unchanged; vibecoding added).
create or replace function public.live_sessions_set_cohort() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if NEW.tier = 'aimastery' then
    if TG_OP = 'INSERT' then
      if NEW.cohort_start is null then NEW.cohort_start := public.aimastery_cohort_of_class(NEW.session_date); end if;
    elsif NEW.cohort_start is null
          or (NEW.session_date is distinct from OLD.session_date
              and NEW.cohort_start is not distinct from OLD.cohort_start
              and OLD.cohort_start is not distinct from public.aimastery_cohort_of_class(OLD.session_date)) then
      NEW.cohort_start := public.aimastery_cohort_of_class(NEW.session_date);
    end if;
  elsif NEW.tier = 'vibecoding' then
    if TG_OP = 'INSERT' then
      if NEW.cohort_start is null then NEW.cohort_start := public.vibecoding_cohort_of_class(NEW.session_date); end if;
    elsif NEW.cohort_start is null
          or (NEW.session_date is distinct from OLD.session_date
              and NEW.cohort_start is not distinct from OLD.cohort_start
              and OLD.cohort_start is not distinct from public.vibecoding_cohort_of_class(OLD.session_date)) then
      NEW.cohort_start := public.vibecoding_cohort_of_class(NEW.session_date);
    end if;
  else
    NEW.cohort_start := null;
  end if;
  return NEW;
end; $$;

-- Keep vibecoding_cohorts in step with the admin's cohort_schedule date.
--   * Date moved while that batch has NOT started: it's a reschedule - students and
--     sessions move to the new date, the old row goes away.
--   * Otherwise it's a new batch: add it, keep the old one (its students and
--     recordings stay with it).
--   * Either way, students waiting on 'infinity' move onto the new upcoming batch.
create or replace function public.cohort_schedule_sync_vibecoding() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  new_at timestamptz;
  old_at timestamptz;
begin
  if NEW.tier <> 'vibecoding' or NEW.start_date is null then return NEW; end if;
  new_at := (NEW.start_date::timestamp + interval '18 hours') at time zone 'UTC';
  if TG_OP = 'UPDATE' and OLD.start_date is not null then
    old_at := (OLD.start_date::timestamp + interval '18 hours') at time zone 'UTC';
  end if;
  if old_at is not null and old_at = new_at then return NEW; end if;

  insert into public.vibecoding_cohorts (starts_at) values (new_at) on conflict do nothing;

  if old_at is not null and old_at > now() then
    update public.entitlements set vibecoding_cohort_start = new_at where vibecoding_cohort_start = old_at;
    update public.live_sessions set cohort_start = new_at where tier = 'vibecoding' and cohort_start = old_at;
    delete from public.vibecoding_cohorts where starts_at = old_at;
  end if;

  if new_at > now() then
    update public.entitlements set vibecoding_cohort_start = new_at where vibecoding_cohort_start = 'infinity';
  end if;
  return NEW;
end; $$;
drop trigger if exists sync_vibecoding_cohort on public.cohort_schedule;
create trigger sync_vibecoding_cohort after insert or update of start_date on public.cohort_schedule
  for each row execute function public.cohort_schedule_sync_vibecoding();

-- Backfill: existing vibecoding sessions and (if any) students go to the seeded batch.
update public.live_sessions set cohort_start = public.vibecoding_cohort_of_class(session_date)
 where tier = 'vibecoding' and cohort_start is null;
update public.entitlements set vibecoding_cohort_start = (select min(starts_at) from public.vibecoding_cohorts)
 where vibecoding_expires_at is not null and vibecoding_cohort_start is null;

-- Invariants (fail the migration if any existing row breaks them).
alter table public.live_sessions drop constraint if exists live_sessions_aimastery_cohort_required;
alter table public.live_sessions drop constraint if exists live_sessions_cohort_required;
alter table public.live_sessions add constraint live_sessions_cohort_required
  check (tier not in ('aimastery', 'vibecoding') or cohort_start is not null);
alter table public.entitlements drop constraint if exists entitlements_vibecoding_cohort_required;
alter table public.entitlements add constraint entitlements_vibecoding_cohort_required
  check (vibecoding_expires_at is null or vibecoding_cohort_start is not null);

-- Access rule: Vibe Coding now needs a matching batch, like AI Agent Mastery.
alter policy "Live sessions require matching active entitlement or admin" on public.live_sessions
using (
  (exists (select 1 from entitlements e where e.user_id = auth.uid() and e.is_admin = true))
  or (tier = 'builder1' and exists (select 1 from entitlements e where e.user_id = auth.uid() and e.builder1_expires_at is not null and e.builder1_expires_at > now()))
  or (tier = 'builder2' and exists (select 1 from entitlements e where e.user_id = auth.uid() and e.builder2_expires_at is not null and e.builder2_expires_at > now()))
  or (tier = 'vibecoding' and exists (
        select 1 from entitlements e
         where e.user_id = auth.uid()
           and e.vibecoding_expires_at is not null and e.vibecoding_expires_at > now()
           and e.vibecoding_cohort_start is not null
           and e.vibecoding_cohort_start = live_sessions.cohort_start))
  or (tier = 'aimastery' and exists (
        select 1 from entitlements e
         where e.user_id = auth.uid()
           and e.aimastery_expires_at is not null and e.aimastery_expires_at > now()
           and e.aimastery_cohort_start is not null
           and e.aimastery_cohort_start = live_sessions.cohort_start))
  or (tier = 'agentslive' and exists (select 1 from entitlements e where e.user_id = auth.uid() and e.agentslive_expires_at is not null and e.agentslive_expires_at > now()))
);

-- Lock down the new functions (standard revoke treatment).
revoke execute on function public.vibecoding_next_cohort() from public, anon, authenticated;
revoke execute on function public.vibecoding_cohort_of_class(timestamptz) from public, anon, authenticated;
revoke execute on function public.entitlements_set_vibecoding_cohort() from public, anon, authenticated;
revoke execute on function public.cohort_schedule_sync_vibecoding() from public, anon, authenticated;
revoke execute on function public.live_sessions_set_cohort() from public, anon, authenticated;
