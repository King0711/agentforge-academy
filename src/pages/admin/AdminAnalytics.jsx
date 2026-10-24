import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Loader2, AlertCircle, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import TrendChart from '../../components/admin/analytics/TrendChart';
import { VIZ_CSS, compactNumber } from '../../components/admin/analytics/chartTokens';
import {
  BUCKETS, todayLagos, daysBetween, bucketKeys, autoBucket, bucketLabel, presetRange,
} from '../../lib/analyticsDates';

const PRESETS = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: '12m', label: '12 months' },
  { id: 'ytd', label: 'This year' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
];

const BUCKET_LABELS = { day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' };

// Fixed colour per product (never per rank), in the palette's slot order.
const PLAN_SERIES = [
  { id: 'aimastery', label: 'AI Agent Mastery', color: 'var(--series-1)' },
  { id: 'vibecoding', label: 'Vibe Coding', color: 'var(--series-2)' },
  { id: 'builder1', label: 'Builder 1', color: 'var(--series-3)' },
  { id: 'builder2', label: 'Builder 2', color: 'var(--series-4)' },
  { id: 'pro', label: 'Pro', color: 'var(--series-5)' },
  { id: 'other', label: 'Other', color: 'var(--series-other)' },
];

const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`;
const nairaTick = (n) => (n === 0 ? '₦0' : `₦${compactNumber(n)}`);
const count = (n) => Math.round(Number(n) || 0).toLocaleString('en-NG');
const pct = (num, den) => (den > 0 ? `${((num / den) * 100).toFixed(num / den < 0.1 ? 1 : 0)}%` : '—');
const fmtDay = (iso) => bucketLabel(iso, 'day', { long: true });

const SUMMARY_LABELS = { today: 'Today', week: 'This week', month: 'This month', year: 'This year' };
const SUMMARY_VS = { today: 'yesterday', week: 'last week', month: 'last month', year: 'last year' };

// Change against the previous period up to the same point in it. Direction is
// shown with an arrow and a word, never colour alone.
function Delta({ now, prev, vs }) {
  if (prev === 0 && now === 0) return <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No sales yet vs {vs}</span>;
  if (prev === 0) return <span className="text-[11px]" style={{ color: 'var(--good-text)' }}>New · nothing {vs}</span>;
  const change = ((now - prev) / prev) * 100;
  const up = change >= 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: up ? 'var(--good-text)' : 'var(--bad-text)' }}>
      <Icon className="w-3 h-3" /> {Math.abs(change).toFixed(0)}% {up ? 'up' : 'down'} vs {vs}
    </span>
  );
}

function Tile({ label, value, sub, children }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-white dark:bg-[#181818] px-5 py-4">
      <p className="text-xs font-semibold text-body">{label}</p>
      <p className="font-display text-2xl font-extrabold text-ink mt-1">{value}</p>
      {sub && <p className="text-xs text-body mt-0.5">{sub}</p>}
      {children && <div className="mt-1.5">{children}</div>}
    </div>
  );
}

function Section({ title, note, children }) {
  return (
    <section className="rounded-2xl border border-border-soft bg-white dark:bg-[#181818] p-5 mb-5">
      <div className="mb-3">
        <h2 className="font-bold text-ink">{title}</h2>
        {note && <p className="text-xs text-body mt-0.5">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function RankList({ title, rows, valueLabel, labelFor = (l) => l }) {
  const max = Math.max(1, ...rows.map((r) => Number(r.views)));
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-body mb-2">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">Nothing yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.label} className="text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-ink truncate">{labelFor(r.label)}</span>
                <span className="tabular-nums text-body flex-shrink-0">{count(r.views)} {valueLabel}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#F6F8FB] dark:bg-white/5 mt-1">
                <div className="h-1.5 rounded-full" style={{ width: `${(Number(r.views) / max) * 100}%`, background: 'var(--series-1)' }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const inputClass =
  'px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40';

// /admin/analytics: what the site earns and how much traffic it gets
// (supabase/admin-analytics.sql). Revenue and sign-ups come from existing tables;
// traffic is the first-party counter in src/lib/visits.js, so it only goes back to
// the day it shipped.
export default function AdminAnalytics() {
  const [today] = useState(todayLagos);
  const [preset, setPreset] = useState('90d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [bucketChoice, setBucketChoice] = useState('auto');
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('admin_revenue_summary');
      if (cancelled) return;
      if (error) setSummaryError(error.message || 'Failed to load revenue.');
      else setSummary(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { from, to } = useMemo(() => {
    if (preset === 'custom') {
      const ok = customFrom && customTo && customFrom <= customTo;
      return ok ? { from: customFrom, to: customTo } : presetRange('90d', today);
    }
    return presetRange(preset, today, summary?.first_payment);
  }, [preset, customFrom, customTo, today, summary]);

  const bucket = bucketChoice === 'auto' ? autoBucket(from, to) : bucketChoice;
  const key = `${from}|${to}|${bucket}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const args = { p_from: from, p_to: to, p_bucket: bucket };
      const [rev, traffic, signups, funnel, breakdown] = await Promise.all([
        supabase.rpc('admin_revenue_series', args),
        supabase.rpc('admin_traffic_series', args),
        supabase.rpc('admin_signups_series', args),
        supabase.rpc('admin_analytics_funnel', { p_from: from, p_to: to }),
        supabase.rpc('admin_traffic_breakdown', { p_from: from, p_to: to, p_limit: 8 }),
      ]);
      if (cancelled) return;
      const failed = [rev, traffic, signups, funnel, breakdown].find((r) => r.error);
      setResult({
        key,
        error: failed ? failed.error.message || 'Failed to load analytics.' : '',
        rev: rev.data || [],
        traffic: traffic.data || [],
        signups: signups.data || [],
        funnel: funnel.data || {},
        breakdown: breakdown.data || [],
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [key, from, to, bucket]);

  const loading = !result || result.key !== key;
  const data = loading ? null : result;

  const buckets = useMemo(
    () => bucketKeys(from, to, bucket).map((k) => ({ key: k, label: bucketLabel(k, bucket), longLabel: bucketLabel(k, bucket, { long: true }) })),
    [from, to, bucket],
  );

  const revenue = useMemo(() => {
    const values = {};
    const present = new Set();
    let total = 0;
    let orders = 0;
    for (const r of data?.rev ?? []) {
      const plan = PLAN_SERIES.some((p) => p.id === r.plan) ? r.plan : 'other';
      values[r.bucket] = { ...values[r.bucket], [plan]: (values[r.bucket]?.[plan] ?? 0) + Number(r.revenue) };
      present.add(plan);
      total += Number(r.revenue);
      orders += Number(r.orders);
    }
    return { values, series: PLAN_SERIES.filter((p) => present.has(p.id)), total, orders };
  }, [data]);

  const trafficValues = useMemo(() => {
    const values = {};
    for (const r of data?.traffic ?? []) values[r.bucket] = { views: Number(r.views), visitors: Number(r.visitors) };
    return values;
  }, [data]);

  const signupValues = useMemo(() => {
    const values = {};
    let total = 0;
    for (const r of data?.signups ?? []) {
      values[r.bucket] = { signups: Number(r.signups) };
      total += Number(r.signups);
    }
    return { values, total };
  }, [data]);

  const breakdown = useMemo(() => {
    const groups = { page: [], source: [], device: [], country: [] };
    for (const r of data?.breakdown ?? []) groups[r.kind]?.push(r);
    return groups;
  }, [data]);

  const funnel = data?.funnel ?? {};
  const periods = summary?.periods ?? [];
  const trackingStarted = funnel.first_visit;
  const regionName = (code) => {
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
    } catch {
      return code;
    }
  };
  const days = daysBetween(from, to);

  return (
    <div>
      <style>{VIZ_CSS}</style>
      <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3 mb-5">
        <BarChart3 className="w-7 h-7 text-brand" /> Analytics
      </h1>

      {(summaryError || data?.error) && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {summaryError || data.error}
        </div>
      )}

      <div className="viz-root grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
        {Object.keys(SUMMARY_LABELS).map((k) => {
          const p = periods.find((x) => x.key === k);
          return (
            <Tile key={k} label={SUMMARY_LABELS[k]} value={p ? naira(p.revenue) : '…'} sub={p ? `${count(p.orders)} ${p.orders === 1 ? 'order' : 'orders'}` : ' '}>
              {p && <Delta now={Number(p.revenue)} prev={Number(p.prev_revenue)} vs={SUMMARY_VS[k]} />}
            </Tile>
          );
        })}
      </div>
      <p className="text-[12px] text-gray-400 mb-6">
        {summary ? `All time: ${naira(summary.all_revenue)} from ${count(summary.all_orders)} orders. ` : ''}
        Comparisons are against the same point in the previous period. Days are Lagos time. Amounts are what Paystack charged,
        including any card fee passed on to the buyer, before referral commission.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Date range">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              aria-pressed={preset === p.id}
              className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                preset === p.id ? 'bg-brand text-white' : 'bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:text-brand'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" aria-label="From" value={customFrom} max={today} onChange={(e) => setCustomFrom(e.target.value)} className={inputClass} />
            <span className="text-body text-xs">to</span>
            <input type="date" aria-label="To" value={customTo} max={today} onChange={(e) => setCustomTo(e.target.value)} className={inputClass} />
          </div>
        )}
        <label className="flex items-center gap-2 text-xs font-semibold text-body-strong ml-auto">
          Group by
          <select value={bucketChoice} onChange={(e) => setBucketChoice(e.target.value)} className={inputClass}>
            <option value="auto">Auto ({BUCKET_LABELS[autoBucket(from, to)].toLowerCase()})</option>
            {BUCKETS.map((b) => <option key={b} value={b}>{BUCKET_LABELS[b]}</option>)}
          </select>
        </label>
      </div>
      <p className="text-xs text-body mb-4 flex items-center gap-2">
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />}
        {fmtDay(from)} – {fmtDay(to)} · {count(days)} {days === 1 ? 'day' : 'days'}, shown {BUCKET_LABELS[bucket].toLowerCase()}
        {bucket !== 'day' && days > 0 && buckets.length > 400 ? ' (very long range)' : ''}
      </p>

      <Section title="Revenue" note="Each column is one period, split by product.">
        <div className="grid grid-cols-3 gap-3 mb-4 max-w-xl">
          <Tile label="Revenue in range" value={data ? naira(revenue.total) : '…'} />
          <Tile label="Orders" value={data ? count(revenue.orders) : '…'} />
          <Tile label="Average order" value={data && revenue.orders ? naira(revenue.total / revenue.orders) : '—'} />
        </div>
        <TrendChart
          kind="stack"
          label={`Revenue by product, ${BUCKET_LABELS[bucket].toLowerCase()}`}
          buckets={buckets}
          series={revenue.series.length ? revenue.series : [PLAN_SERIES[0]]}
          values={revenue.values}
          formatValue={naira}
          formatTick={nairaTick}
        />
      </Section>

      <Section
        title="Website traffic"
        note="Page views and unique visitors, counted by this site's own tracker. Visitors are distinct within each period, so they don't add up across periods."
      >
        {!loading && !trackingStarted && (
          <p className="flex items-start gap-2 text-xs text-body mb-3">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> No visits recorded yet. Counting starts once the tracker is live.
          </p>
        )}
        {!loading && trackingStarted && trackingStarted > from && (
          <p className="flex items-start gap-2 text-xs text-body mb-3">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> Traffic was first recorded on {fmtDay(trackingStarted)}; earlier days show zero because nothing was counted, not because nobody visited.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 mb-4 max-w-md">
          <Tile label="Page views in range" value={data ? count(funnel.views) : '…'} />
          <Tile label="Unique visitors in range" value={data ? count(funnel.visitors) : '…'} />
        </div>
        <TrendChart
          kind="line"
          label={`Page views and visitors, ${BUCKET_LABELS[bucket].toLowerCase()}`}
          buckets={buckets}
          series={[
            { id: 'views', label: 'Page views', color: 'var(--series-1)' },
            { id: 'visitors', label: 'Unique visitors', color: 'var(--series-2)' },
          ]}
          values={trafficValues}
          formatValue={count}
          formatTick={(n) => compactNumber(n)}
        />
      </Section>

      <Section title="From visit to payment" note="For the selected range. Checkout started counts people who filled the checkout form or opened a checkout while signed in.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 viz-root">
          <Tile label="Unique visitors" value={data ? count(funnel.visitors) : '…'} />
          <Tile label="Started checkout" value={data ? count(funnel.checkout_started) : '…'} sub={data ? `${pct(funnel.checkout_started, funnel.visitors)} of visitors` : ' '} />
          <Tile label="Paid orders" value={data ? count(funnel.paid_orders) : '…'} sub={data ? `${pct(funnel.paid_orders, funnel.checkout_started)} of those who started` : ' '} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3 max-w-md">
          <Tile label="WhatsApp leads" value={data ? count(funnel.whatsapp_leads) : '…'} sub="Not yet at checkout" />
          <Tile label="New accounts" value={data ? count(signupValues.total) : '…'} />
        </div>
      </Section>

      <Section title="New accounts" note="People who created an account, including buyers whose account was created at payment.">
        <TrendChart
          kind="stack"
          label={`New accounts, ${BUCKET_LABELS[bucket].toLowerCase()}`}
          buckets={buckets}
          series={[{ id: 'signups', label: 'New accounts', color: 'var(--series-1)' }]}
          values={signupValues.values}
          formatValue={count}
          formatTick={(n) => compactNumber(n)}
        />
      </Section>

      <Section title="Where visitors come from and what they read">
        <div className="grid sm:grid-cols-2 gap-6 viz-root">
          <RankList title="Top pages" rows={breakdown.page} valueLabel="views" />
          <RankList title="Traffic sources" rows={breakdown.source} valueLabel="visits" />
          <RankList title="Devices" rows={breakdown.device} valueLabel="views" />
          <RankList title="Countries" rows={breakdown.country} valueLabel="views" labelFor={regionName} />
        </div>
      </Section>
    </div>
  );
}
