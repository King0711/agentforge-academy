import { useCallback, useEffect, useMemo, useState } from 'react';
import { Receipt, Loader2, AlertCircle, Download, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import {
  enrich, summarize, salesCsv, watDateTime, watToday, watDayStartIso, watDayAfterIso,
} from '../../lib/salesReport';

// The business started taking payments in 2026; the report defaults to the
// whole year so far.
const yearStart = () => `${watToday().slice(0, 4)}-01-01`;

const naira = (n) =>
  `₦${Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const inputClass =
  'px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40';

function download(text, filename) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SummaryTable({ title, firstColumn, groups, total }) {
  return (
    <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#181818]">
      <h2 className="text-sm font-bold text-ink px-5 py-3 border-b border-border-soft">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-body border-b border-border-soft">
              <th className="px-5 py-2 font-semibold">{firstColumn}</th>
              <th className="px-3 py-2 font-semibold text-right">Sales</th>
              <th className="px-3 py-2 font-semibold text-right">Charged</th>
              <th className="px-3 py-2 font-semibold text-right">Fees (est.)</th>
              <th className="px-5 py-2 font-semibold text-right">Kept</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.key} className="border-b border-border-soft last:border-b-0">
                <td className="px-5 py-2 text-ink">{g.key}</td>
                <td className="px-3 py-2 text-right text-body-strong">{g.count}</td>
                <td className="px-3 py-2 text-right text-body-strong">{naira(g.charged)}</td>
                <td className="px-3 py-2 text-right text-body">{naira(g.fees)}</td>
                <td className="px-5 py-2 text-right font-semibold text-ink">{naira(g.kept)}</td>
              </tr>
            ))}
            <tr className="bg-[#F6F8FB] dark:bg-white/5 font-bold text-ink">
              <td className="px-5 py-2">Total</td>
              <td className="px-3 py-2 text-right">{total.count}</td>
              <td className="px-3 py-2 text-right">{naira(total.charged)}</td>
              <td className="px-3 py-2 text-right">{naira(total.fees)}</td>
              <td className="px-5 py-2 text-right">{naira(total.kept)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminSales() {
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(watToday);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!from || !to || to < from) {
      setError('Pick a start date that is on or before the end date.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.rpc('admin_get_sales_report', {
      p_from: watDayStartIso(from),
      p_to: watDayAfterIso(to),
    });
    if (err) {
      setError(err.message || 'Failed to load the sales report.');
      setRows([]);
    } else {
      setRows(enrich(data || []));
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount and when the dates change
    load();
  }, [load]);

  const summary = useMemo(() => summarize(rows), [rows]);
  const notSales = useMemo(() => rows.filter((r) => !r.sale), [rows]);
  const range = `${from}_to_${to}`;

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3 mb-2">
        <Receipt className="w-7 h-7 text-brand" /> Sales report
      </h1>
      <p className="text-sm text-body mb-5 max-w-2xl">
        Every payment Paystack confirmed to the site. Dates are Nigerian time. &ldquo;Kept&rdquo; is the price
        without the Paystack fee that checkout adds for the buyer; the fee is an estimate, so use
        Paystack&rsquo;s own export for exact settlement figures.
      </p>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 mb-5">
        <label className="text-xs font-bold text-body-strong flex flex-col gap-1">
          From
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
        </label>
        <label className="text-xs font-bold text-body-strong flex flex-col gap-1">
          To
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={inputClass} />
        </label>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button
            type="button"
            onClick={() => download(salesCsv(rows, { full: false }), `sales-report-no-personal-details_${range}.csv`)}
            disabled={loading || rows.length === 0}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-lg bg-brand text-white hover:bg-brand-deep disabled:opacity-40 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Export without personal details
          </button>
          <button
            type="button"
            onClick={() => download(salesCsv(rows, { full: true }), `sales-report-full_${range}.csv`)}
            disabled={loading || rows.length === 0}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:text-brand disabled:opacity-40 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export full (with buyers)
          </button>
        </div>
      </div>
      <p className="text-xs text-body mb-6">
        The full export lists buyer names, emails and Paystack references. The other one has the dates, products
        and amounts only, so it is safe to share outside the team.
      </p>

      {loading ? (
        <div className="px-5 py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['Sales', String(summary.total.count)],
              ['Charged to customers', naira(summary.total.charged)],
              ['Paystack fees (est.)', naira(summary.total.fees)],
              ['Kept after fees', naira(summary.total.kept)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border-soft bg-white dark:bg-[#181818] px-4 py-3">
                <p className="text-xs text-body">{label}</p>
                <p className="text-lg font-extrabold text-ink break-words">{value}</p>
              </div>
            ))}
          </div>

          {summary.total.count === 0 ? (
            <div className="rounded-2xl border border-border-soft bg-white dark:bg-[#181818] px-5 py-10 text-center text-sm text-gray-400">
              No sales in this period.
            </div>
          ) : (
            <>
              <SummaryTable title="By product" firstColumn="Product" groups={summary.byProduct} total={summary.total} />
              <SummaryTable title="By month" firstColumn="Month" groups={summary.byMonth} total={summary.total} />
            </>
          )}

          {notSales.length > 0 && (
            <div className="rounded-2xl border border-border-soft bg-white dark:bg-[#181818] overflow-hidden">
              <h2 className="text-sm font-bold text-ink px-5 py-3 border-b border-border-soft">
                Left out of the totals ({notSales.length})
              </h2>
              {notSales.map((r) => (
                <p key={r.id} className="text-xs text-body px-5 py-2 border-b border-border-soft last:border-b-0">
                  {watDateTime(r.created_at)} · {naira(r.amount)} · {r.status.replace(/_/g, ' ')} (did not unlock a product)
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
