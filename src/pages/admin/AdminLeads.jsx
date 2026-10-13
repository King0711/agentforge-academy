import { useEffect, useMemo, useState } from 'react';
import { Contact, Loader2, AlertCircle, CheckCircle2, MessageCircle, Download } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const TABS = [
  { id: 'unpaid', label: 'Not paid yet' },
  { id: 'paid', label: 'Paid' },
  { id: 'all', label: 'All' },
];

const PLAN_LABELS = {
  builder1: 'Builder 1',
  builder2: 'Builder 2',
  pro: 'Pro',
  vibecoding: 'Vibe Coding',
  aimastery: 'AI Agent Mastery',
};

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

// Checkout leads: everyone who filled in the name / email / phone form before
// going to Paystack (supabase/guest-checkout.sql). One row per attempt, so
// somebody who tried twice appears twice; a lead is "paid" once the webhook has
// verified a payment for it.
export default function AdminLeads() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('unpaid');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase.rpc('admin_list_checkout_leads', { p_limit: 2000 });
      if (cancelled) return;
      if (err) setError(err.message || 'Failed to load leads.');
      else setRows(data || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // A person who tried more than once and then paid shouldn't still show as an
  // unpaid lead: hide an unpaid row when the same email has a paid one.
  const paidEmails = useMemo(() => new Set(rows.filter((r) => r.paid).map((r) => r.email.toLowerCase())), [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === 'paid' && !r.paid) return false;
      if (tab === 'unpaid' && (r.paid || paidEmails.has(r.email.toLowerCase()))) return false;
      if (!q) return true;
      return [r.name, r.email, r.phone].some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, tab, query, paidEmails]);

  const exportCsv = () => {
    const header = ['Name', 'Email', 'Phone', 'Plan', 'Paid', 'Date'];
    const lines = visible.map((r) =>
      [r.name, r.email, r.phone, PLAN_LABELS[r.plan] || r.plan, r.paid ? 'yes' : 'no', r.created_at].map(csvCell).join(','),
    );
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkout-leads-${tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3 mb-5">
        <Contact className="w-7 h-7 text-brand" /> Checkout leads
      </h1>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                tab === t.id ? 'bg-brand text-white' : 'bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:text-brand'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or phone"
          className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
        <button
          onClick={exportCsv}
          disabled={visible.length === 0}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:text-brand disabled:opacity-40 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#181818]">
        {loading ? (
          <div className="px-5 py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
          </div>
        ) : visible.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">No leads here yet.</div>
        ) : (
          visible.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border-soft last:border-b-0 flex-wrap">
              <div className="min-w-0">
                <p className="font-semibold text-ink truncate">
                  {r.name}{' '}
                  <span className="text-xs font-normal text-gray-400">· {PLAN_LABELS[r.plan] || r.plan}</span>
                </p>
                <p className="text-xs text-body break-all">
                  {r.email} · {r.phone} · {fmtDate(r.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {r.paid && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-link bg-[#E8EDF3] dark:bg-brand/15 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Paid
                  </span>
                )}
                <a
                  href={`https://wa.me/${r.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:text-brand transition-colors"
                >
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </a>
              </div>
            </div>
          ))
        )}
      </div>
      <p className="text-[12px] text-gray-400 mt-3">
        One row per checkout attempt. “Not paid yet” hides anyone who has since paid under the same email.
      </p>
    </div>
  );
}
