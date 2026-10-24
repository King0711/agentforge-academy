-- Admin analytics (2026-10-24): revenue, site traffic, sign-ups and a simple
-- visitor -> checkout -> paid funnel for /admin/analytics.
--
-- Revenue and sign-ups come from tables that already exist (payments, profiles,
-- checkout_leads, checkout_attempts). Traffic did not exist anywhere in the
-- database - Google Analytics holds it, but nothing here can read it - so this
-- adds a small first-party counter: the site posts one row per page view to the
-- track-visit Edge function (no cookies, no IP stored; a random browser id is
-- kept only as a keyed hash so unique visitors can be counted). Traffic history
-- therefore starts the day this ships; it cannot be backfilled.
--
-- Access model: RLS on, no policies, no grants to anon/authenticated. Only the
-- function (service role) writes site_visits; admins read through the admin_*
-- RPCs below, each with the project's three revoke/grant statements and the
-- admin_session_ok() check (supabase/admin-mfa.sql).
--
-- Days are Africa/Lagos calendar days throughout (WAT, no DST), so "today" and
-- the month boundaries match how the team talks about them. "Revenue" is the
-- amount Paystack charged for payments whose status starts with 'granted'
-- (granted, granted_backfill_fee_mismatch, ...). It includes any Paystack fee
-- passed on to the buyer, and nothing is netted off for referral commission.
--
-- Apply BEFORE deploying track-visit, then merge the frontend.

-- ---------- traffic ----------
create table if not exists public.site_visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null,
  -- Only meaningful on the first page of a visit (is_entry): where they came
  -- from, already reduced to a channel/host by the function.
  source text,
  is_entry boolean not null default false,
  device text,
  country text,
  -- Keyed hash of a random browser id; null when the browser blocks storage.
  visitor_hash text,
  -- Keyed hash of the caller's IP, used only to rate-limit the endpoint.
  ip_hash text,
  constraint site_visits_path_len check (char_length(path) between 1 and 200),
  constraint site_visits_source_len check (source is null or char_length(source) <= 60),
  constraint site_visits_device_chk check (device is null or device in ('mobile', 'desktop', 'tablet')),
  constraint site_visits_country_chk check (country is null or country ~ '^[A-Z]{2}$')
);

create index if not exists site_visits_created_idx on public.site_visits (created_at);
create index if not exists site_visits_ip_idx on public.site_visits (ip_hash, created_at) where ip_hash is not null;

alter table public.site_visits enable row level security;
revoke all on public.site_visits from anon, authenticated;

-- Raw rows older than ~2 years add nothing to a monthly/yearly trend.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'site-visits-prune-weekly';
    perform cron.schedule(
      'site-visits-prune-weekly',
      '30 3 * * 0',
      $job$delete from public.site_visits where created_at < now() - interval '800 days'$job$
    );
  end if;
end
$$;

-- ---------- revenue: headline numbers ----------
-- Today / this week (Mon-) / this month / this year, each against the previous
-- period up to the SAME point in it (so a Wednesday is compared with last
-- Wednesday, not with a whole week), plus all time and the first payment date.
create or replace function public.admin_revenue_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamp := now() at time zone 'Africa/Lagos';
  v_result jsonb;
begin
  if not exists (
    select 1 from entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true and public.admin_session_ok()
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  with paid as (
    select p.amount, (p.created_at at time zone 'Africa/Lagos') as lt
    from payments p
    where p.status like 'granted%'
  ),
  periods(k, cur_start, prev_start) as (
    values
      ('today', date_trunc('day', v_now),   date_trunc('day', v_now)   - interval '1 day'),
      ('week',  date_trunc('week', v_now),  date_trunc('week', v_now)  - interval '1 week'),
      ('month', date_trunc('month', v_now), date_trunc('month', v_now) - interval '1 month'),
      ('year',  date_trunc('year', v_now),  date_trunc('year', v_now)  - interval '1 year')
  )
  select jsonb_build_object(
    'periods', (
      select jsonb_agg(jsonb_build_object(
        'key', pr.k,
        'revenue',      coalesce((select sum(x.amount) from paid x where x.lt >= pr.cur_start), 0),
        'orders',       (select count(*) from paid x where x.lt >= pr.cur_start),
        'prev_revenue', coalesce((select sum(x.amount) from paid x
                                   where x.lt >= pr.prev_start and x.lt <= pr.prev_start + (v_now - pr.cur_start)), 0),
        'prev_orders',  (select count(*) from paid x
                          where x.lt >= pr.prev_start and x.lt <= pr.prev_start + (v_now - pr.cur_start))
      ) order by case pr.k when 'today' then 1 when 'week' then 2 when 'month' then 3 else 4 end)
      from periods pr
    ),
    'all_revenue', coalesce((select sum(amount) from paid), 0),
    'all_orders',  (select count(*) from paid),
    'first_payment', (select min(lt)::date from paid),
    'today', v_now::date
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.admin_revenue_summary() from public;
revoke execute on function public.admin_revenue_summary() from anon;
grant execute on function public.admin_revenue_summary() to authenticated;

-- ---------- revenue: trend by product ----------
create or replace function public.admin_revenue_series(p_from date, p_to date, p_bucket text default 'day')
returns table (bucket date, plan text, orders bigint, revenue numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true and public.admin_session_ok()
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;
  if p_bucket not in ('day', 'week', 'month', 'year') then
    raise exception 'Bucket must be day, week, month or year';
  end if;

  return query
    select date_trunc(p_bucket, p.created_at at time zone 'Africa/Lagos')::date as bucket,
           coalesce(p.plan, 'other') as plan,
           count(*) as orders,
           coalesce(sum(p.amount), 0) as revenue
    from payments p
    where p.status like 'granted%'
      and (p.created_at at time zone 'Africa/Lagos')::date between p_from and p_to
    group by 1, 2
    order by 1, 2;
end;
$$;

revoke execute on function public.admin_revenue_series(date, date, text) from public;
revoke execute on function public.admin_revenue_series(date, date, text) from anon;
grant execute on function public.admin_revenue_series(date, date, text) to authenticated;

-- ---------- traffic: trend ----------
-- visitors are distinct per bucket, so they do not add up across buckets.
create or replace function public.admin_traffic_series(p_from date, p_to date, p_bucket text default 'day')
returns table (bucket date, views bigint, visitors bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true and public.admin_session_ok()
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;
  if p_bucket not in ('day', 'week', 'month', 'year') then
    raise exception 'Bucket must be day, week, month or year';
  end if;

  return query
    select date_trunc(p_bucket, v.created_at at time zone 'Africa/Lagos')::date as bucket,
           count(*) as views,
           count(distinct v.visitor_hash) as visitors
    from site_visits v
    where (v.created_at at time zone 'Africa/Lagos')::date between p_from and p_to
    group by 1
    order by 1;
end;
$$;

revoke execute on function public.admin_traffic_series(date, date, text) from public;
revoke execute on function public.admin_traffic_series(date, date, text) from anon;
grant execute on function public.admin_traffic_series(date, date, text) to authenticated;

-- ---------- traffic: top pages / sources / devices / countries ----------
-- Pages and countries count page views; sources count visits (first page only).
create or replace function public.admin_traffic_breakdown(p_from date, p_to date, p_limit int default 10)
returns table (kind text, label text, views bigint, visitors bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true and public.admin_session_ok()
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  return query
    with v as (
      select * from site_visits s
      where (s.created_at at time zone 'Africa/Lagos')::date between p_from and p_to
    ),
    agg as (
      select 'page'::text as kind, v.path as label, count(*) as views, count(distinct v.visitor_hash) as visitors
        from v group by v.path
      union all
      select 'source', coalesce(nullif(v.source, ''), 'direct'), count(*), count(distinct v.visitor_hash)
        from v where v.is_entry group by 2
      union all
      select 'device', v.device, count(*), count(distinct v.visitor_hash)
        from v where v.device is not null group by v.device
      union all
      select 'country', v.country, count(*), count(distinct v.visitor_hash)
        from v where v.country is not null group by v.country
    ),
    ranked as (
      select a.*, row_number() over (partition by a.kind order by a.views desc, a.label) as rn
      from agg a
    )
    select r.kind, r.label, r.views, r.visitors
    from ranked r
    where r.rn <= greatest(1, least(coalesce(p_limit, 10), 50))
    order by r.kind, r.rn;
end;
$$;

revoke execute on function public.admin_traffic_breakdown(date, date, int) from public;
revoke execute on function public.admin_traffic_breakdown(date, date, int) from anon;
grant execute on function public.admin_traffic_breakdown(date, date, int) to authenticated;

-- ---------- new accounts: trend ----------
create or replace function public.admin_signups_series(p_from date, p_to date, p_bucket text default 'day')
returns table (bucket date, signups bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true and public.admin_session_ok()
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;
  if p_bucket not in ('day', 'week', 'month', 'year') then
    raise exception 'Bucket must be day, week, month or year';
  end if;

  return query
    select date_trunc(p_bucket, pr.created_at at time zone 'Africa/Lagos')::date as bucket,
           count(*) as signups
    from profiles pr
    where (pr.created_at at time zone 'Africa/Lagos')::date between p_from and p_to
    group by 1
    order by 1;
end;
$$;

revoke execute on function public.admin_signups_series(date, date, text) from public;
revoke execute on function public.admin_signups_series(date, date, text) from anon;
grant execute on function public.admin_signups_series(date, date, text) to authenticated;

-- ---------- funnel for the selected range ----------
-- visitors -> started checkout -> paid. "Started checkout" is people who filled
-- the checkout form (guests) or opened a checkout while signed in; WhatsApp
-- leads are counted separately because they have not reached Paystack.
create or replace function public.admin_analytics_funnel(p_from date, p_to date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if not exists (
    select 1 from entitlements ent
    where ent.user_id = auth.uid() and ent.is_admin = true and public.admin_session_ok()
  ) then
    raise exception 'Unauthorized: Admin access required';
  end if;

  select jsonb_build_object(
    'views', (select count(*) from site_visits v
               where (v.created_at at time zone 'Africa/Lagos')::date between p_from and p_to),
    'visitors', (select count(distinct v.visitor_hash) from site_visits v
                  where (v.created_at at time zone 'Africa/Lagos')::date between p_from and p_to),
    'checkout_started', (
      (select count(distinct l.phone) from checkout_leads l
        where l.source = 'checkout'
          and (l.created_at at time zone 'Africa/Lagos')::date between p_from and p_to)
      + (select count(distinct a.user_id) from checkout_attempts a
          where (a.created_at at time zone 'Africa/Lagos')::date between p_from and p_to)
    ),
    'whatsapp_leads', (select count(distinct l.phone) from checkout_leads l
                        where l.source in ('whatsapp_form', 'whatsapp_manual')
                          and (l.created_at at time zone 'Africa/Lagos')::date between p_from and p_to),
    'paid_orders', (select count(*) from payments p
                     where p.status like 'granted%'
                       and (p.created_at at time zone 'Africa/Lagos')::date between p_from and p_to),
    'revenue', (select coalesce(sum(p.amount), 0) from payments p
                 where p.status like 'granted%'
                   and (p.created_at at time zone 'Africa/Lagos')::date between p_from and p_to),
    'signups', (select count(*) from profiles pr
                 where (pr.created_at at time zone 'Africa/Lagos')::date between p_from and p_to),
    'first_visit', (select min(v.created_at at time zone 'Africa/Lagos')::date from site_visits v)
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.admin_analytics_funnel(date, date) from public;
revoke execute on function public.admin_analytics_funnel(date, date) from anon;
grant execute on function public.admin_analytics_funnel(date, date) to authenticated;
