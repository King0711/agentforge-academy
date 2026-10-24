import { useEffect, useMemo, useRef, useState } from 'react';
import { Table2, BarChart3 } from 'lucide-react';

const HEIGHT = 280;
const MARGIN = { top: 14, right: 14, bottom: 30, left: 56 };

// Round the top of the axis up to a clean number with four even steps.
function niceScale(max) {
  if (max <= 0) return { top: 4, step: 1 };
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * pow).find((s) => s >= rough) ?? 10 * pow;
  return { top: step * Math.ceil(max / step), step };
}

// Bar with the data end (top) rounded 4px and the baseline end square.
function topRoundedRect(x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`;
}

/**
 * Trend chart over time buckets.
 * kind 'stack'  - stacked columns (one segment per series, 2px surface gaps)
 * kind 'line'   - one 2px line per series
 * buckets: [{ key, label, longLabel }]   series: [{ id, label, color }]
 * values: { [bucketKey]: { [seriesId]: number } }
 */
export default function TrendChart({ kind, buckets, series, values, formatValue, formatTick, label, totalLabel = 'Total' }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState(null);
  const [view, setView] = useState('chart');

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.floor(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const band = plotW / Math.max(1, buckets.length);

  const totals = useMemo(
    () => buckets.map((b) => series.reduce((sum, s) => sum + (values[b.key]?.[s.id] ?? 0), 0)),
    [buckets, series, values],
  );
  const maxY = useMemo(() => {
    if (kind === 'stack') return Math.max(0, ...totals);
    return Math.max(0, ...buckets.flatMap((b) => series.map((s) => values[b.key]?.[s.id] ?? 0)));
  }, [kind, totals, buckets, series, values]);
  const scale = useMemo(() => niceScale(maxY), [maxY]);

  const y = (v) => MARGIN.top + plotH - (v / scale.top) * plotH;
  const xCenter = (i) => MARGIN.left + band * i + band / 2;
  const ticks = Array.from({ length: Math.round(scale.top / scale.step) + 1 }, (_, i) => i * scale.step);
  const labelEvery = Math.max(1, Math.ceil(56 / band));
  const barW = Math.min(24, band * 0.7);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const idx = Math.floor((e.clientX - rect.left - MARGIN.left) / band);
    setHover(idx >= 0 && idx < buckets.length ? idx : null);
  };

  const hovered = hover != null ? buckets[hover] : null;
  const tipLeft = hover != null ? Math.min(Math.max(xCenter(hover) + 12, 4), width - 190) : 0;
  const hasData = maxY > 0;

  return (
    <div className="viz-root">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
        {series.length > 1 ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Legend">
            {series.map((s) => (
              <li key={s.id} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} /> {s.label}
              </li>
            ))}
          </ul>
        ) : <span />}
        <button
          type="button"
          onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
          className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:text-brand transition-colors"
        >
          {view === 'chart' ? <Table2 className="w-3 h-3" /> : <BarChart3 className="w-3 h-3" />}
          {view === 'chart' ? 'Table view' : 'Chart view'}
        </button>
      </div>

      {view === 'table' ? (
        <div className="overflow-auto max-h-[320px] rounded-lg border border-border-soft">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white dark:bg-[#181818]">
              <tr className="text-left text-body">
                <th className="px-3 py-2 font-semibold">Period</th>
                {series.map((s) => <th key={s.id} className="px-3 py-2 font-semibold text-right">{s.label}</th>)}
                {kind === 'stack' && series.length > 1 && <th className="px-3 py-2 font-semibold text-right">{totalLabel}</th>}
              </tr>
            </thead>
            <tbody>
              {buckets.map((b, i) => (
                <tr key={b.key} className="border-t border-border-soft">
                  <td className="px-3 py-1.5 text-ink">{b.longLabel}</td>
                  {series.map((s) => (
                    <td key={s.id} className="px-3 py-1.5 text-right tabular-nums text-ink">{formatValue(values[b.key]?.[s.id] ?? 0)}</td>
                  ))}
                  {kind === 'stack' && series.length > 1 && <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-ink">{formatValue(totals[i])}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrapRef} className="relative" style={{ height: HEIGHT }}>
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={label}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            style={{ display: 'block', touchAction: 'pan-y' }}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={MARGIN.left} x2={width - MARGIN.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? 'var(--axis)' : 'var(--grid)'} strokeWidth="1" />
                <text x={MARGIN.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">{formatTick(t)}</text>
              </g>
            ))}
            {buckets.map((b, i) =>
              i % labelEvery === 0 ? (
                <text key={b.key} x={xCenter(i)} y={HEIGHT - 10} textAnchor="middle" fontSize="11" fill="var(--text-muted)">{b.label}</text>
              ) : null,
            )}

            {hover != null && <line x1={xCenter(hover)} x2={xCenter(hover)} y1={MARGIN.top} y2={MARGIN.top + plotH} stroke="var(--axis)" strokeWidth="1" />}

            {kind === 'stack' &&
              buckets.map((b, i) => {
                let acc = 0;
                const present = series.filter((s) => (values[b.key]?.[s.id] ?? 0) > 0);
                return present.map((s, idx) => {
                  const v = values[b.key][s.id];
                  const top = y(acc + v);
                  const bottom = y(acc);
                  acc += v;
                  // 2px surface gap between segments: shave it off the segment's lower edge.
                  const h = Math.max(1, bottom - top - (idx > 0 ? 2 : 0));
                  const isTop = idx === present.length - 1;
                  const x = xCenter(i) - barW / 2;
                  const yy = top;
                  return isTop ? (
                    <path key={s.id} d={topRoundedRect(x, yy, barW, h, 4)} fill={s.color} />
                  ) : (
                    <rect key={s.id} x={x} y={yy} width={barW} height={h} fill={s.color} />
                  );
                });
              })}

            {kind === 'line' &&
              series.map((s) => {
                const pts = buckets.map((b, i) => `${xCenter(i)},${y(values[b.key]?.[s.id] ?? 0)}`).join(' ');
                const lastIdx = buckets.length - 1;
                const lastV = values[buckets[lastIdx]?.key]?.[s.id] ?? 0;
                return (
                  <g key={s.id}>
                    <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                    {buckets.length > 0 && <circle cx={xCenter(lastIdx)} cy={y(lastV)} r="4" fill={s.color} stroke="var(--surface-1)" strokeWidth="2" />}
                    {hover != null && (
                      <circle cx={xCenter(hover)} cy={y(values[buckets[hover].key]?.[s.id] ?? 0)} r="4" fill={s.color} stroke="var(--surface-1)" strokeWidth="2" />
                    )}
                  </g>
                );
              })}
          </svg>

          {!hasData && (
            <div className="absolute inset-0 flex items-center justify-center text-sm pointer-events-none" style={{ color: 'var(--text-muted)' }}>
              Nothing recorded in this period.
            </div>
          )}

          {hovered && hasData && (
            <div
              className="absolute z-10 pointer-events-none rounded-lg border px-3 py-2 text-xs shadow-md"
              style={{ left: tipLeft, top: 8, minWidth: 150, background: 'var(--surface-1)', borderColor: 'var(--grid)', color: 'var(--text-primary)' }}
            >
              <p className="font-semibold mb-1">{hovered.longLabel}</p>
              {series.map((s) => {
                const v = values[hovered.key]?.[s.id] ?? 0;
                if (kind === 'stack' && v === 0) return null;
                return (
                  <p key={s.id} className="flex items-center justify-between gap-4" style={{ color: 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-sm" style={{ background: s.color }} /> {s.label}
                    </span>
                    <span className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{formatValue(v)}</span>
                  </p>
                );
              })}
              {kind === 'stack' && series.length > 1 && (
                <p className="flex items-center justify-between gap-4 mt-1 pt-1 border-t font-semibold" style={{ borderColor: 'var(--grid)' }}>
                  <span>{totalLabel}</span>
                  <span className="tabular-nums">{formatValue(totals[hover])}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
