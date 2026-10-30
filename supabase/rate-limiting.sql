-- Shared rate limiter for Edge Functions (2026-10-22).
--
-- Until now each public function counted its own recent rows (checkout_leads,
-- scholarship_applications, email_subscribers, ...) or, in meta-capi's case, kept a
-- per-instance Map that resets on every cold start. That only protected the one write
-- each function happened to store, and nothing at all protected endpoints that store
-- nothing (validate_coupon, guest-checkout-status, delete-account).
--
-- This is one fixed-window counter any function can call:
--     select * from rate_limit_hit('bucket', 'key', limit, window_seconds);
-- through supabase/functions/_shared/rateLimit.ts. Callable by service_role ONLY - the
-- functions already hold it, and a browser must never be able to read or reset counters.
--
-- Fixed windows allow up to 2x the limit across a window boundary. That is fine for
-- abuse control; it is not a billing meter.
--
-- Kill switch (no deploy needed): update public.rate_limit_settings set enabled = false;

-- ---------- switch ----------
create table if not exists public.rate_limit_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.rate_limit_settings (id) values (true) on conflict (id) do nothing;
alter table public.rate_limit_settings enable row level security;
revoke all on public.rate_limit_settings from anon, authenticated;

-- ---------- counters ----------
create table if not exists public.rate_limit_hits (
  bucket text not null,
  key text not null,
  window_start timestamptz not null,
  hit_count integer not null default 0,
  primary key (bucket, key, window_start)
);
alter table public.rate_limit_hits enable row level security;
revoke all on public.rate_limit_hits from anon, authenticated;

-- ---------- the check ----------
-- Counts the request (blocked ones too, so hammering inside a window stays blocked),
-- then says whether it is within the limit. `key` is whatever identifies the caller:
-- a hashed IP, a user id, an email hash.
create or replace function public.rate_limit_hit(
  p_bucket text,
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, current_hits integer, retry_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_hits integer;
begin
  if p_limit < 1 or p_window_seconds < 1 or p_window_seconds > 86400
     or coalesce(length(p_bucket), 0) not between 1 and 80
     or coalesce(length(p_key), 0) not between 1 and 200 then
    raise exception 'invalid rate limit arguments';
  end if;

  if not coalesce((select s.enabled from public.rate_limit_settings s where s.id), true) then
    return query select true, 0, 0;
    return;
  end if;

  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limit_hits as r (bucket, key, window_start, hit_count)
  values (p_bucket, p_key, v_window_start, 1)
  on conflict (bucket, key, window_start) do update set hit_count = r.hit_count + 1
  returning r.hit_count into v_hits;

  return query select
    v_hits <= p_limit,
    v_hits,
    case when v_hits <= p_limit then 0
      else greatest(1, ceil(extract(epoch from (v_window_start + make_interval(secs => p_window_seconds) - now())))::integer)
    end;
end;
$$;

revoke execute on function public.rate_limit_hit(text, text, integer, integer) from public;
revoke execute on function public.rate_limit_hit(text, text, integer, integer) from anon;
revoke execute on function public.rate_limit_hit(text, text, integer, integer) from authenticated;
grant execute on function public.rate_limit_hit(text, text, integer, integer) to service_role;

-- ---------- housekeeping ----------
create or replace function public.rate_limit_purge()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.rate_limit_hits where window_start < now() - interval '2 days';
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function public.rate_limit_purge() from public;
revoke execute on function public.rate_limit_purge() from anon;
revoke execute on function public.rate_limit_purge() from authenticated;
grant execute on function public.rate_limit_purge() to service_role;

-- pg_cron is UTC. Hourly, at minute 17 so it does not pile onto the :00 jobs.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.schedule('rate-limit-purge', '17 * * * *', 'select public.rate_limit_purge()');
  end if;
end;
$$;
