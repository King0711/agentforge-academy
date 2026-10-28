import { useEffect, useMemo, useState } from 'react';
import { MousePointerClick, Loader2, AlertCircle, Info } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { VIZ_CSS } from '../../components/admin/analytics/chartTokens';
import { todayLagos, daysBetween, presetRange, bucketLabel } from '../../lib/analyticsDates';

const COURSES = [
  { id: 'aimastery', label: 'AI Agent Mastery', path: '/ai-agent-mastery' },
  { id: 'vibecoding', label: 'Vibe Coding', path: '/vibe-coding' },
];

const PRESETS = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'all', label: 'All time' },
  { id: 'custom', label: 'Custom' },
];

// Sections in page order, with the names shown here. A section the page has but
// nobody reached still appears (as 0), so a dead zone is visible.
const SECTIONS = {
  aimastery: [
    ['hero', 'Hero'], ['system', 'Under the hood'], ['demo', 'Demo videos'], ['instructor', 'Instructor'],
    ['curriculum', 'Curriculum'], ['fit', 'Gut check'], ['capabilities', 'Capabilities'], ['compare', 'Tools vs team'],
    ['outcomes', 'Outcomes'], ['audience', 'Who it is for'], ['qualifier', 'Is it for you'], ['reviews', 'Reviews'],
    ['faq', 'FAQ'], ['pricing', 'Pricing'], ['final', 'Final call to action'],
  ],
  vibecoding: [
    ['hero', 'Hero'], ['intro', 'Introduction'], ['method', 'VIBE method'], ['projects', 'Projects'],
    ['curriculum', 'Week by week'], ['outcomes', 'What you learn'], ['audience', 'Who it is for'], ['toolkit', 'Tools'],
    ['faq', 'FAQ'], ['pricing', 'Pricing'], ['final', 'Final call to action'],
  ],
};

const CTA_NAMES = {
  hero_primary: 'Hero: join button',
  hero_demo: 'Hero: watch it in action',
  hero_projects: 'Hero: see what you will build',
  demo_cta: 'After demos',
  curriculum_cta: 'After curriculum',
  capabilities_cta: 'After capabilities',
  qualifier_cta: 'After "is it for you"',
  reviews_cta: 'After reviews',
  sticky_bar: 'Mobile sticky bar',
  final_cta: 'Final call to action',
  pay: 'Pricing card: pay button',
};

const FIELD_NAMES = { name: 'Full name', email: 'Email', phone: 'Phone number' };

const ERROR_NAMES = {
  name_short: 'Name too short',
  phone_invalid: 'Phone number not valid',
  email_invalid: 'Email not valid',
  rate_limited: 'Too many attempts',
  server: 'Other checkout error',
};

const SCROLL_STEPS = [10, 25, 50, 75, 90, 100];

const count = (n) => Math.round(Number(n) || 0).toLocaleString('en-NG');
const naira = (n) => `₦${Math.round(Number(n) || 0).toLocaleString('en-NG')}`;
const pct = (num, den) => (den > 0 ? `${((num / den) * 100).toFixed(num / den < 0.1 ? 1 : 0)}%` : '—');
const seconds = (ms) => (ms == null ? '—' : `${(Number(ms) / 1000).toFixed(Number(ms) < 10000 ? 2 : 1)} s`);
const prettify = (label) => label.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const fmtDay = (iso) => bucketLabel(iso, 'day', { long: true });

const inputClass =
  'px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40';

function Tile({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-border-soft bg-white dark:bg-[#181818] px-5 py-4">
      <p className="text-xs font-semibold text-body">{label}</p>
      <p className="font-display text-2xl font-extrabold text-ink mt-1">{value}</p>
      {sub && <p className="text-xs text-body mt-0.5">{sub}</p>}
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

function Empty({ children }) {
  return <p className="text-xs text-gray-400">{children}</p>;
}

// One horizontal bar: a label, a number, and a bar scaled against `max`.
function BarRow({ label, right, value, max, sub }) {
  return (
    <li className="text-xs">
      <div className="flex items-center justify-between gap-3">
        <span className="text-ink truncate">{label}</span>
        <span className="tabular-nums text-body flex-shrink-0">{right}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#F6F8FB] dark:bg-white/5 mt-1">
        <div className="h-1.5 rounded-full" style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, background: 'var(--series-1)' }} />
      </div>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </li>
  );
}

// Core Web Vitals "good" line for the largest contentful paint is 2.5 s (75th percentile).
function vitalsVerdict(lcpP75) {
  if (lcpP75 == null) return null;
  if (lcpP75 <= 2500) return 'Good';
  if (lcpP75 <= 4000) return 'Needs improvement';
  return 'Poor';
}

// /admin/course-pages: landing-page analytics for the two live cohorts' sales pages
// (supabase/course-page-analytics.sql, src/lib/coursePageTracking.js). Counts only
// visitors who are not admins and not already enrolled, and only from the day the
// tracker shipped.
export default function AdminCoursePages() {
  const [today] = useState(todayLagos);
  const [course, setCourse] = useState('aimastery');
  const [preset, setPreset] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [result, setResult] = useState(null);

  const { from, to } = useMemo(() => {
    if (preset === 'custom') {
      const ok = customFrom && customTo && customFrom <= customTo;
      return ok ? { from: customFrom, to: customTo } : presetRange('30d', today);
    }
    // "All time" starts at the first day this tracker could have recorded anything.
    return presetRange(preset, today, '2026-10-01');
  }, [preset, customFrom, customTo, today]);

  const key = `${course}|${from}|${to}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('admin_course_page_analytics', { p_page: course, p_from: from, p_to: to });
      if (cancelled) return;
      setResult({ key, error: error ? error.message || 'Failed to load analytics.' : '', data: data || null });
    })();
    return () => {
      cancelled = true;
    };
  }, [key, course, from, to]);

  const loading = !result || result.key !== key;
  const d = loading ? null : result.data;
  const totals = d?.totals ?? {};
  const form = d?.form ?? {};
  const perf = d?.perf ?? {};
  const days = daysBetween(from, to);
  const courseInfo = COURSES.find((c) => c.id === course);

  const funnel = [
    { label: 'Visitors', value: Number(totals.visitors) || 0, hint: 'Opened the page' },
    { label: 'Reached pricing', value: Number(totals.reached_pricing) || 0, hint: 'Scrolled to the pricing card' },
    { label: 'Clicked pay', value: Number(totals.clicked_pay) || 0, hint: 'Pressed the pay button' },
    { label: 'Sent to Paystack', value: Number(totals.to_paystack) || 0, hint: 'Checkout started (signed-in, or details saved as a lead)' },
    { label: 'Paid', value: Number(totals.paid_tracked) || 0, hint: 'Paid, and came back to the site afterwards' },
  ];
  const funnelMax = Math.max(1, funnel[0].value);

  const sectionRows = useMemo(() => {
    const byLabel = new Map((d?.sections ?? []).map((s) => [s.label, s]));
    return SECTIONS[course].map(([id, name]) => ({ id, name, people: Number(byLabel.get(id)?.people) || 0, avgMs: Number(byLabel.get(id)?.avg_ms) || 0 }));
  }, [d, course]);

  const scrollRows = useMemo(() => {
    const byDepth = new Map((d?.scroll ?? []).map((s) => [Number(s.depth), Number(s.people)]));
    return SCROLL_STEPS.map((step) => ({ step, people: byDepth.get(step) || 0 }));
  }, [d]);

  const ctaRows = useMemo(
    () =>
      (d?.ctas ?? [])
        .map((c) => {
          const clickers = Number(c.clickers) || 0;
          // A click always counts as a view too; if a view event was lost, never show a rate above 100%.
          return { id: c.label, viewers: Math.max(Number(c.viewers) || 0, clickers), clickers };
        })
        .sort((a, b) => b.clickers - a.clickers || b.viewers - a.viewers),
    [d],
  );

  const visitors = Number(totals.visitors) || 0;
  const verdict = vitalsVerdict(perf.lcp_p75);
  const untracked = Math.max(0, (Number(totals.paid_all) || 0) - (Number(totals.paid_tracked) || 0));

  return (
    <div className="viz-root">
      <style>{VIZ_CSS}</style>
      <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3 mb-2">
        <MousePointerClick className="w-7 h-7 text-brand" /> Course pages
      </h1>
      <p className="text-sm text-body mb-5">
        How visitors move through the sales page of each live cohort, from first view to payment. Admins and students who are
        already enrolled are not counted. Tracking started when this shipped, so earlier days are empty.
      </p>

      {result?.error && !loading && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {result.error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1.5" role="group" aria-label="Course page">
          {COURSES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCourse(c.id)}
              aria-pressed={course === c.id}
              className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                course === c.id ? 'bg-brand text-white' : 'bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:text-brand'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
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
      </div>
      <p className="text-xs text-body mb-4 flex items-center gap-2">
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />}
        {courseInfo.path} · {fmtDay(from)} – {fmtDay(to)} · {count(days)} {days === 1 ? 'day' : 'days'}
        {d?.first_event ? ` · first recorded ${fmtDay(d.first_event)}` : ''}
      </p>

      {!loading && !d?.first_event && (
        <p className="flex items-start gap-2 text-xs text-body mb-4">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> Nothing recorded for this page yet. Counting starts once the tracker is live.
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Tile label="Visitors" value={d ? count(totals.visitors) : '…'} sub={d ? `${count(totals.views)} page views` : ' '} />
        <Tile label="Form starts" value={d ? count(form.started) : '…'} sub={d ? `${pct(form.started, form.opened)} of those who opened it` : ' '} />
        <Tile label="Form submissions" value={d ? count(form.submitted) : '…'} sub={d ? `${pct(form.submitted, form.started)} of starts` : ' '} />
        <Tile
          label="Conversion rate"
          value={d ? pct(totals.paid_tracked, totals.visitors) : '…'}
          sub="Tracked payments ÷ visitors"
        />
      </div>

      <Section
        title="Conversion funnel"
        note="People, not clicks: each person counts once per step. Percentages are of the step before."
      >
        {d && visitors === 0 ? (
          <Empty>No funnel data in this period.</Empty>
        ) : (
          <ol className="space-y-3">
            {funnel.map((step, i) => (
              <BarRow
                key={step.label}
                label={`${i + 1}. ${step.label}`}
                right={`${count(step.value)}${i > 0 ? ` · ${pct(step.value, funnel[i - 1].value)} of previous` : ''}`}
                value={step.value}
                max={funnelMax}
                sub={step.hint}
              />
            ))}
          </ol>
        )}
        {d && (
          <p className="text-xs text-body mt-4 border-t border-border-soft pt-3">
            Payments for this course in the range, from any source: <strong className="text-ink">{count(totals.paid_all)}</strong>{' '}
            ({naira(totals.revenue_all)}).
            {untracked > 0
              ? ` ${count(untracked)} of them are not in the funnel above - the buyer paid from another device, cleared their browser data, never returned from Paystack, or paid before tracking began.`
              : ''}
          </p>
        )}
      </Section>

      <Section
        title="Checkout form"
        note="The form signed-out visitors fill in before paying. Only which steps were completed is recorded, never what was typed."
      >
        <div className="grid sm:grid-cols-4 gap-3 mb-4">
          <Tile label="Opened" value={d ? count(form.opened) : '…'} />
          <Tile label="Started typing" value={d ? count(form.started) : '…'} sub={d ? pct(form.started, form.opened) : ' '} />
          <Tile label="Submitted" value={d ? count(form.submitted) : '…'} sub={d ? pct(form.submitted, form.started) : ' '} />
          <Tile
            label="Median time to submit"
            value={d ? seconds(d.submit_med) : '…'}
            sub="From first keystroke"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-body mb-2">Field completion</h3>
            {!d?.fields?.length ? (
              <Empty>No form-field data in this period.</Empty>
            ) : (
              <ul className="space-y-2">
                {d.fields.map((f) => (
                  <BarRow
                    key={f.label}
                    label={FIELD_NAMES[f.label] ?? prettify(f.label)}
                    right={`${count(f.people)} · ${pct(f.people, form.opened)} of openers`}
                    value={Number(f.people)}
                    max={Math.max(1, Number(form.opened) || 0)}
                  />
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-body mb-2">Validation issues</h3>
            {!d?.errors?.length ? (
              <Empty>No validation issues recorded.</Empty>
            ) : (
              <ul className="space-y-2">
                {d.errors.map((er) => (
                  <BarRow
                    key={er.label}
                    label={ERROR_NAMES[er.label] ?? prettify(er.label)}
                    right={`${count(er.count)} × · ${count(er.people)} ${Number(er.people) === 1 ? 'person' : 'people'}`}
                    value={Number(er.count)}
                    max={Math.max(1, ...d.errors.map((x) => Number(x.count)))}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>

      <Section
        title="Page speed"
        note="From visitors who opened this page directly (navigation timing does not exist for in-site clicks). Medians, with the 75th percentile as the slow-visitor figure."
      >
        {!perf.samples ? (
          <Empty>No speed data in this period.</Empty>
        ) : (
          <>
            {verdict && (
              <p className="text-sm text-ink mb-3">
                Core Web Vitals signal: <strong>{verdict}</strong>{' '}
                <span className="text-body">(largest content paint, slowest quarter: {seconds(perf.lcp_p75)}; good is 2.5 s or less)</span>
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Tile label="Median server response" value={seconds(perf.ttfb_med)} />
              <Tile label="Median load" value={seconds(perf.load_med)} />
              <Tile label="Slowest-quarter load" value={seconds(perf.load_p75)} />
              <Tile label="Median largest content paint" value={seconds(perf.lcp_med)} />
              <Tile label="Slowest-quarter content paint" value={seconds(perf.lcp_p75)} />
              <Tile label="Page loads measured" value={count(perf.samples)} />
            </div>
          </>
        )}
      </Section>

      <div className="grid lg:grid-cols-2 gap-x-5">
        <Section title="Scroll depth" note="Share of visitors who got this far down the page.">
          {d && visitors === 0 ? (
            <Empty>No scroll data yet.</Empty>
          ) : (
            <ul className="space-y-2">
              {scrollRows.map((s) => (
                <BarRow key={s.step} label={`${s.step}% depth`} right={`${count(s.people)} · ${pct(s.people, visitors)}`} value={s.people} max={Math.max(1, visitors)} />
              ))}
            </ul>
          )}
        </Section>

        <Section title="Section engagement" note="How many visitors reached each section, and the average time it was on screen for them.">
          {d && visitors === 0 ? (
            <Empty>No section data in this period.</Empty>
          ) : (
            <ul className="space-y-2">
              {sectionRows.map((s, i) => (
                <BarRow
                  key={s.id}
                  label={`${i + 1}. ${s.name}`}
                  right={`${count(s.people)} · ${pct(s.people, visitors)} reached`}
                  value={s.people}
                  max={Math.max(1, visitors)}
                  sub={s.people > 0 ? `${seconds(s.avgMs)} average attention` : undefined}
                />
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Call-to-action performance" note="Each button: people who saw it, people who clicked it, and the click rate.">
        {ctaRows.length === 0 ? (
          <Empty>No button data in this period.</Empty>
        ) : (
          <ul className="space-y-2">
            {ctaRows.map((c) => (
              <BarRow
                key={c.id}
                label={CTA_NAMES[c.id] ?? prettify(c.id)}
                right={`${count(c.clickers)} clicked of ${count(c.viewers)} saw it · ${pct(c.clickers, c.viewers)}`}
                value={c.clickers}
                max={Math.max(1, ...ctaRows.map((x) => x.clickers))}
              />
            ))}
          </ul>
        )}
      </Section>

      <Section title="Where visitors come from" note={'One count per person. "Direct" and the named sources are people who opened this page itself; "other pages on this site" clicked through from elsewhere on the site, where their real source was recorded.'}>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            ['Traffic sources', d?.sources],
            ['Campaigns (utm_campaign)', d?.campaigns],
            ['Devices', d?.devices],
          ].map(([title, rows]) => (
            <div key={title}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-body mb-2">{title}</h3>
              {!rows?.length ? (
                <Empty>No source data yet.</Empty>
              ) : (
                <ul className="space-y-2">
                  {rows.map((r) => (
                    <BarRow
                      key={r.label}
                      label={r.label}
                      right={`${count(r.people)} · ${pct(r.people, visitors)}`}
                      value={Number(r.people)}
                      max={Math.max(1, ...rows.map((x) => Number(x.people)))}
                    />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
