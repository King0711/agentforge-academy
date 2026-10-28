-- Course page analytics (2026-10-28): landing-page analytics for the two live
-- cohorts' sales pages, /ai-agent-mastery and /vibe-coding, shown at
-- /admin/course-pages. Modelled on the Prolanz client portal's "Landing Page
-- Analytics": visitors, a conversion funnel, page speed, scroll depth, section
-- engagement, CTA performance, checkout-form field completion and validation
-- issues, traffic sources - plus a "Paid" step Prolanz cannot see, matched to
-- real granted payments.
--
-- The site's own tracker (src/lib/coursePageTracking.js) runs only on those two
-- pages, never for admins or for students already enrolled in that course, and
-- posts small batches to the public track-page-events Edge function
-- (verify_jwt = false), which writes page_events. No cookies and no raw
-- identifiers: the browser id is stored as the same keyed hash site_visits uses
-- (so the two tables agree on who is a unique visitor), the IP only as a keyed
-- hash for rate limiting, and nothing typed into the checkout form is sent -
-- only which fields were filled in and which check failed.
--
-- "Paid" works like this: after a verified payment, the buyer's browser (on
-- /dashboard or /checkout/complete, see trackPurchase in src/lib/pixel.js)
-- posts a 'paid' event carrying a plain SHA-256 of the Paystack reference. That
-- only counts when the hash matches a payments row for the same plan whose
-- status starts with 'granted', and when the same browser had viewed the course
-- page. A buyer who never comes back from Paystack, clears their storage or
-- pays from another device is missed, so the page also shows every granted
-- payment for the course in the range, from any source.
--
-- Access model: RLS on, no policies, no grants to anon/authenticated. Only the
-- function (service role) writes; admins read through admin_course_page_analytics
-- (standard three revoke/grant statements + admin_session_ok()). Days are
-- Africa/Lagos calendar days, as in supabase/admin-analytics.sql.
--
-- Apply BEFORE deploying track-page-events, then merge the frontend.

create table if not exists public.page_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- The course whose page this happened on (checkout plan key).
  page text not null,
  -- Random id for one page view, made fresh by the browser on every view.
  view_id text not null,
  -- Keyed hash of the browser id in localStorage (same key as site_visits);
  -- null when the browser blocks storage.
  visitor_hash text,
  event text not null,
  -- Which section / button / field / scroll depth / speed metric / error.
  label text,
  -- Milliseconds for perf, section_time and form_submit; null otherwise.
  value numeric,
  -- 'view' rows only: true when the page was opened directly (a full page
  -- load) rather than reached by clicking around the site.
  is_entry boolean not null default false,
  -- 'view' rows only: where the visit came from, as a channel or host, and
  -- the utm_campaign of the visit, if any.
  source text,
  campaign text,
  device text,
  -- 'paid' rows only: SHA-256 (hex) of the Paystack reference.
  ref_hash text,
  -- Keyed hash of the caller's IP, used only to rate-limit the endpoint.
  ip_hash text,
  constraint page_events_page_chk check (page in ('aimastery', 'vibecoding')),
  constraint page_events_view_chk check (view_id ~ '^[a-f0-9]{16,32}$'),
  constraint page_events_event_chk check (event in (
    'view', 'perf', 'scroll', 'section', 'section_time', 'cta_view', 'cta_click',
    'form_open', 'form_start', 'field_done', 'form_submit', 'form_error', 'to_paystack', 'paid'
  )),
  constraint page_events_label_chk check (label is null or label ~ '^[a-z0-9_]{1,40}$'),
  constraint page_events_value_chk check (value is null or (value >= 0 and value <= 86400000)),
  constraint page_events_source_len check (source is null or char_length(source) <= 60),
  constraint page_events_campaign_len check (campaign is null or char_length(campaign) <= 60),
  constraint page_events_device_chk check (device is null or device in ('mobile', 'desktop', 'tablet')),
  constraint page_events_ref_chk check (ref_hash is null or ref_hash ~ '^[a-f0-9]{64}$')
);

create index if not exists page_events_page_created_idx on public.page_events (page, created_at);
create index if not exists page_events_ip_idx on public.page_events (ip_hash, created_at) where ip_hash is not null;

alter table public.page_events enable row level security;
revoke all on public.page_events from anon, authenticated;

-- Same retention as site_visits.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'page-events-prune-weekly';
    perform cron.schedule(
      'page-events-prune-weekly',
      '45 3 * * 0',
      $job$delete from public.page_events where created_at < now() - interval '800 days'$job$
    );
  end if;
end
$$;

-- Everything /admin/course-pages shows for one course page and date range, as
-- one JSON document. People are counted once per step: a browser's hashed id,
-- or the page view's own id when the browser blocks storage.
create or replace function public.admin_course_page_analytics(p_page text, p_from date, p_to date)
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
  if p_page not in ('aimastery', 'vibecoding') then
    raise exception 'Unknown course page';
  end if;

  with ev as (
    select e.*, coalesce(e.visitor_hash, e.view_id) as who
    from page_events e
    where e.page = p_page
      and e.event <> 'paid'
      and (e.created_at at time zone 'Africa/Lagos')::date between p_from and p_to
  ),
  granted as (
    select encode(sha256(convert_to(p.provider_transaction_id, 'UTF8')), 'hex') as ref_hash
    from payments p
    where p.plan = p_page and p.status like 'granted%' and p.provider_transaction_id is not null
  ),
  paid_tracked as (
    select distinct e.visitor_hash
    from page_events e
    join granted g on g.ref_hash = e.ref_hash
    where e.page = p_page
      and e.event = 'paid'
      and e.visitor_hash is not null
      and (e.created_at at time zone 'Africa/Lagos')::date between p_from and p_to
      and exists (
        select 1 from page_events v
        where v.page = p_page and v.event = 'view' and v.visitor_hash = e.visitor_hash
          and v.created_at <= e.created_at
      )
  ),
  section_people as (
    select ev.label, ev.who from ev where ev.event = 'section' group by 1, 2
  ),
  section_time as (
    select ev.label, sum(ev.value) as ms from ev where ev.event = 'section_time' group by 1
  )
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'views',           (select count(distinct ev.view_id) from ev where ev.event = 'view'),
      'visitors',        (select count(distinct ev.who) from ev where ev.event = 'view'),
      'reached_pricing', (select count(distinct ev.who) from ev where ev.event = 'section' and ev.label = 'pricing'),
      'clicked_pay',     (select count(distinct ev.who) from ev where ev.event = 'cta_click' and ev.label = 'pay'),
      'to_paystack',     (select count(distinct ev.who) from ev where ev.event = 'to_paystack'),
      'paid_tracked',    (select count(*) from paid_tracked),
      'paid_all',        (select count(*) from payments p
                           where p.plan = p_page and p.status like 'granted%'
                             and (p.created_at at time zone 'Africa/Lagos')::date between p_from and p_to),
      'revenue_all',     (select coalesce(sum(p.amount), 0) from payments p
                           where p.plan = p_page and p.status like 'granted%'
                             and (p.created_at at time zone 'Africa/Lagos')::date between p_from and p_to)
    ),
    'form', jsonb_build_object(
      'opened',    (select count(distinct ev.who) from ev where ev.event = 'form_open'),
      'started',   (select count(distinct ev.who) from ev where ev.event = 'form_start'),
      'submitted', (select count(distinct ev.who) from ev where ev.event = 'form_submit'),
      'saved',     (select count(distinct ev.who) from ev where ev.event = 'to_paystack' and ev.label = 'guest'),
      'server_errors', (select count(*) from ev where ev.event = 'form_error' and ev.label = 'server')
    ),
    'fields', coalesce((
      select jsonb_agg(jsonb_build_object('label', f.label, 'people', f.n) order by f.n desc)
      from (select ev.label, count(distinct ev.who) as n from ev where ev.event = 'field_done' group by 1) f
    ), '[]'::jsonb),
    'errors', coalesce((
      select jsonb_agg(jsonb_build_object('label', x.label, 'count', x.n, 'people', x.people) order by x.n desc)
      from (select ev.label, count(*) as n, count(distinct ev.who) as people
            from ev where ev.event = 'form_error' group by 1) x
    ), '[]'::jsonb),
    'perf', (
      select jsonb_build_object(
        'samples',  count(distinct ev.view_id),
        'ttfb_med', percentile_cont(0.5)  within group (order by ev.value) filter (where ev.label = 'ttfb'),
        'load_med', percentile_cont(0.5)  within group (order by ev.value) filter (where ev.label = 'load'),
        'load_p75', percentile_cont(0.75) within group (order by ev.value) filter (where ev.label = 'load'),
        'lcp_med',  percentile_cont(0.5)  within group (order by ev.value) filter (where ev.label = 'lcp'),
        'lcp_p75',  percentile_cont(0.75) within group (order by ev.value) filter (where ev.label = 'lcp')
      )
      from ev where ev.event = 'perf'
    ),
    'submit_med', (select percentile_cont(0.5) within group (order by ev.value)
                   from ev where ev.event = 'form_submit' and ev.value is not null),
    'scroll', coalesce((
      select jsonb_agg(jsonb_build_object('depth', s.depth, 'people', s.n) order by s.depth)
      from (select ev.label::int as depth, count(distinct ev.who) as n
            from ev where ev.event = 'scroll' and ev.label ~ '^[0-9]{1,3}$' group by 1) s
    ), '[]'::jsonb),
    'sections', coalesce((
      select jsonb_agg(jsonb_build_object(
        'label', sp.label,
        'people', sp.n,
        'avg_ms', case when sp.n > 0 then round(coalesce(st.ms, 0) / sp.n) else 0 end
      ))
      from (select label, count(*) as n from section_people group by 1) sp
      left join section_time st on st.label = sp.label
    ), '[]'::jsonb),
    'ctas', coalesce((
      select jsonb_agg(jsonb_build_object('label', c.label, 'viewers', c.viewers, 'clickers', c.clickers))
      from (
        select ev.label,
               count(distinct ev.who) filter (where ev.event = 'cta_view') as viewers,
               count(distinct ev.who) filter (where ev.event = 'cta_click') as clickers
        from ev where ev.event in ('cta_view', 'cta_click') group by 1
      ) c
    ), '[]'::jsonb),
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object('label', s.label, 'people', s.n) order by s.n desc, s.label)
      from (select coalesce(nullif(ev.source, ''), 'direct') as label, count(distinct ev.who) as n
            from ev where ev.event = 'view' group by 1) s
    ), '[]'::jsonb),
    'campaigns', coalesce((
      select jsonb_agg(jsonb_build_object('label', s.label, 'people', s.n) order by s.n desc, s.label)
      from (select ev.campaign as label, count(distinct ev.who) as n
            from ev where ev.event = 'view' and ev.campaign is not null group by 1) s
    ), '[]'::jsonb),
    'devices', coalesce((
      select jsonb_agg(jsonb_build_object('label', s.label, 'people', s.n) order by s.n desc, s.label)
      from (select ev.device as label, count(distinct ev.who) as n
            from ev where ev.event = 'view' and ev.device is not null group by 1) s
    ), '[]'::jsonb),
    'first_event', (select min(e.created_at at time zone 'Africa/Lagos')::date from page_events e where e.page = p_page)
  ) into v_result;

  return v_result;
end;
$$;

revoke execute on function public.admin_course_page_analytics(text, date, date) from public;
revoke execute on function public.admin_course_page_analytics(text, date, date) from anon;
grant execute on function public.admin_course_page_analytics(text, date, date) to authenticated;
