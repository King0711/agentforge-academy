import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Ticket, Loader2, AlertCircle, Copy, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-border text-sm text-ink bg-transparent focus:outline-none focus:ring-2 focus:ring-brand/40';

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

// Active / Used up / Expired / Disabled, in the order a human cares about.
function codeState(c) {
  if (c.disabled) return 'disabled';
  if (c.used_count >= c.max_uses) return 'used';
  if (c.expires_at && Date.parse(c.expires_at) <= Date.now()) return 'expired';
  return 'active';
}

const STATE_STYLE = {
  active: ['Active', 'text-green bg-[#EAFAF1] dark:bg-green/10'],
  used: ['Used', 'text-link bg-[#E8EDF3] dark:bg-brand/15'],
  expired: ['Expired', 'text-amber-700 dark:text-amber-400 bg-[#FEF9E7] dark:bg-amber-500/10'],
  disabled: ['Disabled', 'text-rose bg-[#FBEAE9] dark:bg-rose/10'],
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'used', label: 'Used' },
  { id: 'inactive', label: 'Expired / disabled' },
];

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Discount codes for AI Agent Mastery (supabase/discount-codes.sql). A code takes
// the price down to ₦10,000 at checkout; paystack-webhook counts the use once the
// payment is verified. Codes are only ever shown in full to admins.
export default function AdminDiscountCodes() {
  const { showToast } = useOutletContext();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const [count, setCount] = useState(1);
  const [label, setLabel] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [expiresOn, setExpiresOn] = useState('');
  const [creating, setCreating] = useState(false);
  const [fresh, setFresh] = useState([]); // codes from the last "Generate"
  const [togglingId, setTogglingId] = useState(null);

  const load = async () => {
    const { data, error: err } = await supabase.rpc('admin_list_discount_codes');
    if (err) setError(err.message || 'Failed to load codes.');
    else setCodes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    // Not awaited inside the effect body: setState happens after the request.
    supabase.rpc('admin_list_discount_codes').then(({ data, error: err }) => {
      if (err) setError(err.message || 'Failed to load codes.');
      else setCodes(data || []);
      setLoading(false);
    });
  }, []);

  const generate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      // The expiry is the end of the chosen day, Lagos time (UTC+1, no DST).
      const expiresAt = expiresOn ? new Date(`${expiresOn}T23:59:59+01:00`).toISOString() : null;
      const { data, error: err } = await supabase.rpc('admin_create_discount_codes', {
        p_count: Number(count),
        p_label: label.trim() || null,
        p_max_uses: Number(maxUses),
        p_expires_at: expiresAt,
      });
      if (err) throw err;
      setFresh(data || []);
      showToast(`${(data || []).length} code${(data || []).length === 1 ? '' : 's'} generated.`);
      await load();
    } catch (err) {
      setError(err.message || 'Could not generate codes.');
    } finally {
      setCreating(false);
    }
  };

  const toggleDisabled = async (c) => {
    setTogglingId(c.id);
    setError('');
    const { error: err } = await supabase.rpc('admin_set_discount_code_disabled', {
      p_id: c.id,
      p_disabled: !c.disabled,
    });
    if (err) setError(err.message || 'Could not update the code.');
    else setCodes((prev) => prev.map((x) => (x.id === c.id ? { ...x, disabled: !c.disabled } : x)));
    setTogglingId(null);
  };

  const copy = async (text, message) => {
    showToast((await copyText(text)) ? message : 'Could not copy — select the text and copy it by hand.');
  };

  const shown = codes.filter((c) => {
    const s = codeState(c);
    if (filter === 'all') return true;
    if (filter === 'inactive') return s === 'expired' || s === 'disabled';
    return s === filter;
  });
  const activeCount = codes.filter((c) => codeState(c) === 'active').length;
  const usedCount = codes.reduce((n, c) => n + c.used_count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3">
          <Ticket className="w-7 h-7 text-link" />
          Discount Codes
        </h1>
        {codes.length > 0 && (
          <span className="text-xs font-bold text-body bg-[#E8EDF3] dark:bg-brand/15 px-2.5 py-1 rounded-full">
            {activeCount} active · {usedCount} redeemed
          </span>
        )}
      </div>
      <p className="text-[13.5px] text-body mb-6 max-w-2xl">
        For AI Agent Mastery. A buyer types the code on the price card and pays ₦10,000 instead of the full price.
        A use is counted only after their payment is confirmed.
      </p>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <form
        onSubmit={generate}
        className="rounded-2xl border border-border-soft bg-white dark:bg-[#131E2F] p-5 mb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
      >
        <div>
          <label htmlFor="dc-count" className="block text-xs font-semibold text-body-strong mb-1">How many codes</label>
          <input id="dc-count" type="number" min={1} max={100} required value={count} onChange={(e) => setCount(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="dc-uses" className="block text-xs font-semibold text-body-strong mb-1">Uses per code</label>
          <input id="dc-uses" type="number" min={1} max={1000} required value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="dc-expiry" className="block text-xs font-semibold text-body-strong mb-1">Expires (optional)</label>
          <input id="dc-expiry" type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="dc-label" className="block text-xs font-semibold text-body-strong mb-1">Note (optional)</label>
          <input id="dc-label" type="text" maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Oct webinar" className={inputClass} />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            {creating && <Loader2 className="w-4 h-4 animate-spin" />}
            Generate {Number(count) === 1 ? 'code' : 'codes'}
          </button>
        </div>
      </form>

      {fresh.length > 0 && (
        <div className="rounded-2xl border-2 border-green/40 bg-[#EAFAF1] dark:bg-green/10 p-5 mb-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <p className="text-sm font-bold text-green flex items-center gap-1.5">
              <Check className="w-4 h-4" /> {fresh.length} new {fresh.length === 1 ? 'code' : 'codes'}
            </p>
            <button
              type="button"
              onClick={() => copy(fresh.map((c) => c.code).join('\n'), 'Copied.')}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-[#131E2F] border border-border text-body-strong hover:border-brand/40"
            >
              <Copy className="w-3.5 h-3.5" /> Copy {fresh.length === 1 ? 'code' : 'all'}
            </button>
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {fresh.map((c) => (
              <li key={c.id} className="font-mono text-[15px] font-bold text-ink bg-white dark:bg-[#131E2F] rounded-lg px-3 py-2 select-all">
                {c.code}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`text-[13px] font-semibold px-4 py-2 rounded-full border transition-colors ${
              filter === f.id
                ? 'bg-brand text-white border-brand'
                : 'bg-white dark:bg-[#131E2F] text-body-strong border-border hover:border-brand/40'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#131E2F]">
        {loading ? (
          <div className="px-5 py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-link mx-auto" />
          </div>
        ) : shown.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">
            {codes.length === 0 ? 'No codes yet. Generate your first one above.' : 'No codes here.'}
          </div>
        ) : (
          shown.map((c) => {
            const [stateLabel, stateStyle] = STATE_STYLE[codeState(c)];
            return (
              <div key={c.id} className="px-5 py-4 border-b border-border-soft last:border-b-0 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-mono text-[15px] font-bold text-ink select-all">{c.code}</p>
                  <p className="text-[12px] text-body">
                    {c.label ? <>{c.label} · </> : null}
                    {c.used_count} of {c.max_uses} used
                    {c.expires_at ? <> · expires {fmtDate(c.expires_at)}</> : null}
                    {c.last_redeemed_at ? <> · last used {fmtDate(c.last_redeemed_at)}</> : null}
                  </p>
                  <p className="text-[11.5px] text-gray-400">Created {fmtDate(c.created_at)}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${stateStyle}`}>{stateLabel}</span>
                  <button
                    type="button"
                    onClick={() => copy(c.code, 'Code copied.')}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-body-strong hover:border-brand/40 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDisabled(c)}
                    disabled={togglingId === c.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-body-strong hover:border-rose/50 hover:text-rose disabled:opacity-40 transition-colors"
                  >
                    {c.disabled ? 'Enable' : 'Disable'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
