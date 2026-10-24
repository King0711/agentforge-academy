import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Contact, Loader2, AlertCircle, CheckCircle2, MessageCircle, Download, Plus, X, CalendarPlus, CalendarDays, Check,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { COUNTRIES, DEFAULT_COUNTRY, buildE164, findCountry } from '../../data/countryCodes';
import { googleCalendarUrl, downloadIcs } from '../../lib/calendarLinks';

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
  unspecified: 'Not sure yet',
};

const SOURCE_LABELS = {
  checkout: 'Checkout form',
  whatsapp_form: 'WhatsApp form',
  whatsapp_manual: 'Added by hand',
};

// WhatsApp-form leads can list several plans ('aimastery,builder1').
const planLabel = (plan) =>
  String(plan ?? '')
    .split(',')
    .map((p) => PLAN_LABELS[p] || p)
    .join(' + ');

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const fmtWhen = (iso) =>
  new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

// Names and emails come from a public form, so a cell that starts with = + - @
// (or a tab / carriage return) would run as a formula when the file is opened
// in Excel or Sheets. A leading single quote makes it plain text.
const csvText = (value) => {
  const text = String(value ?? '');
  return csvCell(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text);
};

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40';

// <input type="datetime-local"> value for "now + a bit", in the admin's own zone.
function localInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function calendarEvent(lead, followup) {
  const lines = [
    `Lead: ${lead.name} · ${lead.phone}${lead.email ? ` · ${lead.email}` : ''}`,
    `Interested in: ${planLabel(lead.plan)}`,
    followup.note ? `Last follow-up: ${followup.note}` : '',
    `WhatsApp: https://wa.me/${lead.phone.replace(/\D/g, '')}`,
  ].filter(Boolean);
  return {
    id: followup.id,
    title: `${followup.next_action} - ${lead.name}`,
    details: lines.join('\n'),
    startIso: followup.next_action_at,
  };
}

function CalendarButtons({ lead, followup }) {
  if (!followup.next_action_at || !followup.next_action) return null;
  const event = calendarEvent(lead, followup);
  const btn =
    'flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:text-brand transition-colors';
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" className={btn}>
        <CalendarPlus className="w-3 h-3" /> Google Calendar
      </a>
      <button type="button" onClick={() => downloadIcs(event, `follow-up-${lead.name.replace(/\W+/g, '-').toLowerCase()}.ics`)} className={btn}>
        <Download className="w-3 h-3" /> .ics
      </button>
    </span>
  );
}

function AddLeadForm({ onSaved, onCancel }) {
  const [name, setName] = useState('');
  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('unspecified');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const country = findCountry(countryIso);
    const e164 = buildE164(country, phone);
    if (name.trim().length < 2) return setError('Enter their name.');
    if (!e164) return setError(`Enter a valid number for ${country.name} (+${country.dial}).`);
    setSaving(true);
    const { data, error: err } = await supabase.rpc('admin_add_checkout_lead', {
      p_name: name.trim(),
      p_phone: e164,
      p_email: email.trim() || null,
      p_country_iso: country.iso,
      p_plan: plan,
    });
    setSaving(false);
    if (err) return setError(err.message || 'Could not add the lead.');
    onSaved(data);
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border-soft bg-white dark:bg-[#181818] p-5 mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-ink text-sm">Add a lead who messaged you on WhatsApp</h2>
        <button type="button" onClick={onCancel} aria-label="Close" className="text-gray-400 hover:text-ink">
          <X className="w-4 h-4" />
        </button>
      </div>
      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="al-name" className="block text-xs font-semibold text-body-strong mb-1">Name</label>
          <input id="al-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={inputClass} placeholder="Full name" />
        </div>
        <div>
          <label htmlFor="al-phone" className="block text-xs font-semibold text-body-strong mb-1">WhatsApp number</label>
          <div className="flex gap-2">
            <select
              aria-label="Country code"
              value={countryIso}
              onChange={(e) => setCountryIso(e.target.value)}
              className={`${inputClass} w-[42%] flex-shrink-0`}
            >
              {COUNTRIES.map((c) => (
                <option key={c.iso} value={c.iso}>+{c.dial} {c.name}</option>
              ))}
            </select>
            <input id="al-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} className={`${inputClass} min-w-0`} placeholder="801 234 5678" />
          </div>
        </div>
        <div>
          <label htmlFor="al-email" className="block text-xs font-semibold text-body-strong mb-1">
            Email <span className="font-normal text-body">(optional)</span>
          </label>
          <input id="al-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} className={inputClass} placeholder="name@example.com" />
        </div>
        <div>
          <label htmlFor="al-plan" className="block text-xs font-semibold text-body-strong mb-1">Interested in</label>
          <select id="al-plan" value={plan} onChange={(e) => setPlan(e.target.value)} className={inputClass}>
            {Object.entries(PLAN_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-deep disabled:opacity-60 transition-colors"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add lead
      </button>
    </form>
  );
}

function FollowUpPanel({ lead, followups, onChanged }) {
  const [note, setNote] = useState('');
  const [action, setAction] = useState('');
  const [when, setWhen] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!note.trim() && !action.trim()) return setError('Write how it went or the next action.');
    if (when && !action.trim()) return setError('Say what the next action is, or clear the date.');
    setSaving(true);
    const { data, error: err } = await supabase.rpc('admin_add_lead_followup', {
      p_lead_id: lead.id,
      p_note: note.trim() || null,
      p_next_action: action.trim() || null,
      p_next_action_at: when && action.trim() ? new Date(when).toISOString() : null,
    });
    setSaving(false);
    if (err) return setError(err.message || 'Could not save the follow-up.');
    // Keep what was just saved on screen so the calendar buttons stay one click away.
    setSaved(when && action.trim() ? { id: data, note: note.trim(), next_action: action.trim(), next_action_at: new Date(when).toISOString() } : null);
    setNote('');
    setAction('');
    setWhen('');
    onChanged();
  };

  const toggleDone = async (f) => {
    const { error: err } = await supabase.rpc('admin_set_followup_done', { p_id: f.id, p_done: !f.done_at });
    if (err) setError(err.message || 'Could not update.');
    else onChanged();
  };

  return (
    <div className="px-5 pb-5 pt-1 bg-[#FAF8FF]/60 dark:bg-white/[0.02] border-t border-border-soft">
      <form onSubmit={submit} className="space-y-2.5 mt-3">
        <div>
          <label htmlFor={`fu-note-${lead.id}`} className="block text-xs font-semibold text-body-strong mb-1">How did the call / last follow-up go?</label>
          <textarea
            id={`fu-note-${lead.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            rows={3}
            className={inputClass}
            placeholder="e.g. Spoke for 10 mins. Wants AI Agent Mastery but is waiting for salary on the 28th."
          />
        </div>
        <div className="grid sm:grid-cols-[1fr_auto] gap-3">
          <div>
            <label htmlFor={`fu-action-${lead.id}`} className="block text-xs font-semibold text-body-strong mb-1">Next action</label>
            <input
              id={`fu-action-${lead.id}`}
              value={action}
              onChange={(e) => setAction(e.target.value)}
              maxLength={300}
              className={inputClass}
              placeholder="e.g. Call back to confirm payment"
            />
          </div>
          <div>
            <label htmlFor={`fu-when-${lead.id}`} className="block text-xs font-semibold text-body-strong mb-1">When</label>
            <input
              id={`fu-when-${lead.id}`}
              type="datetime-local"
              value={when}
              min={localInputValue(new Date())}
              onChange={(e) => setWhen(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        {error && (
          <div className="flex items-start gap-2 text-sm text-rose">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand-deep disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save follow-up
          </button>
          {saved && (
            <span className="flex items-center gap-2 text-xs text-body flex-wrap">
              <Check className="w-3.5 h-3.5 text-link" /> Saved. Add it to your calendar:
              <CalendarButtons lead={lead} followup={saved} />
            </span>
          )}
        </div>
      </form>

      {followups.length > 0 && (
        <ul className="mt-5 space-y-3">
          {followups.map((f) => (
            <li key={f.id} className="text-sm border-l-2 border-brand/40 pl-3">
              <p className="text-[11px] text-gray-400">
                {fmtDate(f.created_at)} · {f.author}
              </p>
              {f.note && <p className="text-ink whitespace-pre-wrap">{f.note}</p>}
              {f.next_action && (
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className={`text-[12px] font-semibold ${f.done_at ? 'text-gray-400 line-through' : 'text-brand'}`}>
                    Next: {f.next_action}
                    {f.next_action_at ? ` · ${fmtWhen(f.next_action_at)}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleDone(f)}
                    className="text-[11px] font-semibold px-2 py-1 rounded-md bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:text-brand transition-colors"
                  >
                    {f.done_at ? 'Reopen' : 'Mark done'}
                  </button>
                  {!f.done_at && <CalendarButtons lead={lead} followup={f} />}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Checkout leads: everyone who filled in the name / email / phone form before
// going to Paystack (supabase/guest-checkout.sql), plus everyone who used the
// WhatsApp button's form and anyone an admin added by hand
// (supabase/lead-followups.sql). One row per attempt, so somebody who tried
// twice appears twice; a lead is "paid" once the webhook has verified a payment
// for it. Each lead has a follow-up log: how a call went, and a next action with
// a date that can go on the admin's calendar.
export default function AdminLeads() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('unpaid');
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState(null);
  // Fixed at page load: only decides which next actions are marked overdue.
  const [now] = useState(() => Date.now());

  const loadFollowups = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('admin_list_lead_followups', { p_limit: 5000 });
    if (err) setError(err.message || 'Failed to load follow-ups.');
    else setFollowups(data || []);
  }, []);

  const loadLeads = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('admin_list_checkout_leads', { p_limit: 2000 });
    if (err) setError(err.message || 'Failed to load leads.');
    else setRows(data || []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([loadLeads(), loadFollowups()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadLeads, loadFollowups]);

  // A person who tried more than once and then paid shouldn't still show as an
  // unpaid lead: hide an unpaid row when the same email has a paid one.
  const paidEmails = useMemo(
    () => new Set(rows.filter((r) => r.paid && r.email).map((r) => r.email.toLowerCase())),
    [rows],
  );

  const followupsByLead = useMemo(() => {
    const map = new Map();
    for (const f of followups) {
      if (!map.has(f.lead_id)) map.set(f.lead_id, []);
      map.get(f.lead_id).push(f);
    }
    return map;
  }, [followups]);

  const leadsById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  // The signed-in admin's own open next actions, soonest first. These are the
  // ones they were told to put on their calendar.
  const myUpcoming = useMemo(
    () =>
      followups
        .filter((f) => f.created_by === user?.id && !f.done_at && f.next_action && f.next_action_at && leadsById.has(f.lead_id))
        .sort((a, b) => new Date(a.next_action_at) - new Date(b.next_action_at)),
    [followups, user?.id, leadsById],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === 'paid' && !r.paid) return false;
      if (tab === 'unpaid' && (r.paid || (r.email && paidEmails.has(r.email.toLowerCase())))) return false;
      if (!q) return true;
      return [r.name, r.email, r.phone].some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  }, [rows, tab, query, paidEmails]);

  const exportCsv = () => {
    const header = ['Name', 'Email', 'Phone', 'Plan', 'Source', 'Paid', 'Date'];
    const lines = visible.map((r) =>
      [
        csvText(r.name), csvText(r.email), csvText(r.phone), csvText(planLabel(r.plan)),
        csvCell(SOURCE_LABELS[r.source] || r.source), csvCell(r.paid ? 'yes' : 'no'), csvCell(r.created_at),
      ].join(','),
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

      {myUpcoming.length > 0 && (
        <div className="rounded-2xl border border-border-soft bg-white dark:bg-[#181818] mb-5 overflow-hidden">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink px-5 py-3 border-b border-border-soft">
            <CalendarDays className="w-4 h-4 text-brand" /> My next actions
          </h2>
          {myUpcoming.map((f) => {
            const lead = leadsById.get(f.lead_id);
            const overdue = new Date(f.next_action_at).getTime() < now;
            return (
              <div key={f.id} className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border-soft last:border-b-0 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">
                    {f.next_action} <span className="font-normal text-body">· {lead.name}</span>
                  </p>
                  <p className={`text-xs ${overdue ? 'text-rose font-semibold' : 'text-body'}`}>
                    {overdue ? 'Overdue · ' : ''}{fmtWhen(f.next_action_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <CalendarButtons lead={lead} followup={f} />
                  <button
                    type="button"
                    onClick={() => {
                      setTab('all');
                      setQuery(lead.phone);
                      setOpenId(lead.id);
                    }}
                    className="text-[11px] font-semibold px-2 py-1 rounded-md bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:text-brand transition-colors"
                  >
                    Open lead
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {adding && (
        <AddLeadForm
          onCancel={() => setAdding(false)}
          onSaved={async (id) => {
            setAdding(false);
            await loadLeads();
            setTab('all');
            setQuery('');
            setOpenId(id);
          }}
        />
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
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-brand text-white hover:bg-brand-deep transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add lead
        </button>
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
          visible.map((r) => {
            const list = followupsByLead.get(r.id) ?? [];
            const open = openId === r.id;
            return (
              <div key={r.id} className="border-b border-border-soft last:border-b-0">
                <div className="flex items-center justify-between gap-3 px-5 py-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink truncate">
                      {r.name}{' '}
                      <span className="text-xs font-normal text-gray-400">· {planLabel(r.plan)}</span>
                    </p>
                    <p className="text-xs text-body break-all">
                      {[r.email, r.phone, fmtDate(r.created_at)].filter(Boolean).join(' · ')}
                    </p>
                    {r.source !== 'checkout' && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{SOURCE_LABELS[r.source] || r.source}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {r.paid && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-link bg-[#E8EDF3] dark:bg-brand/15 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Paid
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : r.id)}
                      aria-expanded={open}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                        open ? 'bg-brand text-white' : 'bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:text-brand'
                      }`}
                    >
                      Follow-ups{list.length > 0 ? ` (${list.length})` : ''}
                    </button>
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
                {open && <FollowUpPanel lead={r} followups={list} onChanged={loadFollowups} />}
              </div>
            );
          })
        )}
      </div>
      <p className="text-[12px] text-gray-400 mt-3">
        One row per checkout attempt. “Not paid yet” hides anyone who has since paid under the same email.
        Follow-ups are visible to every admin; “My next actions” shows only the ones you entered.
      </p>
    </div>
  );
}
