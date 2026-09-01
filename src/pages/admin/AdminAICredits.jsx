import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Zap, Power, Search, RefreshCw, AlertCircle, Loader2, Mail,
  Plus, Minus, Save, ShieldAlert,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

function StatCard({ icon: Icon, label, value, color, tint }) {
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4 bg-white dark:bg-[#181818]" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tint }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="font-display text-2xl font-extrabold text-ink">{value}</p>
        <p className="text-xs text-body">{label}</p>
      </div>
    </div>
  );
}

// The kill switch. Fetched and toggled separately from the usage table below
// so flipping it is never blocked by (or accidentally bundled with) a slow
// student list fetch — this is the one control on this whole page a mistake
// on could actually cost money, so it gets its own explicit Save.
function GatewaySwitch({ showToast }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('ai_platform_settings')
      .select('*')
      .eq('id', true)
      .maybeSingle();
    if (err) {
      setError(err.message);
    } else {
      setSettings(data);
      setDraft(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const dirty = settings && draft && JSON.stringify(settings) !== JSON.stringify(draft);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const { error: err } = await supabase.rpc('admin_set_ai_settings', {
        p_gateway_enabled: draft.gateway_enabled,
        p_grant_builder1: draft.grant_builder1,
        p_grant_builder2: draft.grant_builder2,
        p_grant_pro: draft.grant_pro,
        p_daily_cap_per_user: draft.daily_credit_cap_per_user,
        p_daily_cap_platform: draft.daily_credit_cap_platform,
      });
      if (err) throw err;
      setSettings(draft);
      showToast('AI credit settings saved.');
    } catch (err) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border-soft bg-white dark:bg-[#181818] p-8 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }
  if (error && !settings) {
    return (
      <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
      </div>
    );
  }
  if (!draft) return null;

  const isOn = draft.gateway_enabled;

  return (
    <div className="rounded-2xl border border-border-soft bg-white dark:bg-[#181818] overflow-hidden mb-8">
      <button
        onClick={() => setDraft((d) => ({ ...d, gateway_enabled: !d.gateway_enabled }))}
        className={`w-full flex items-center justify-between gap-4 px-6 py-5 transition-colors ${
          isOn ? 'bg-[#EAFAF1] dark:bg-green/10' : 'bg-[#FDEEF4] dark:bg-rose/10'
        }`}
      >
        <div className="flex items-center gap-4 text-left">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isOn ? 'bg-green text-white' : 'bg-rose text-white'}`}>
            <Power className="w-6 h-6" />
          </div>
          <div>
            <p className="font-display text-lg font-extrabold text-ink">
              AI Gateway is {isOn ? 'ON' : 'OFF'}
            </p>
            <p className="text-sm text-body">
              {isOn
                ? 'Students can spend credits right now. Turn off to stop all AI requests instantly.'
                : 'No student can spend a credit while this is off — safe to leave off until a cohort starts.'}
            </p>
          </div>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${isOn ? 'bg-green text-white' : 'bg-rose text-white'}`}>
          Click to turn {isOn ? 'OFF' : 'ON'}
        </span>
      </button>

      <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'grant_builder1', label: 'Builder 1 grant', hint: 'credits on purchase' },
          { key: 'grant_builder2', label: 'Builder 2 grant', hint: 'credits on purchase' },
          { key: 'grant_pro', label: 'Pro grant', hint: 'credits on purchase' },
          { key: 'daily_credit_cap_per_user', label: 'Daily cap / student', hint: 'credits per 24h' },
        ].map((f) => (
          <label key={f.key} className="block">
            <span className="text-xs font-bold text-body uppercase tracking-wide">{f.label}</span>
            <input
              type="number"
              min={0}
              value={draft[f.key]}
              onChange={(e) => setDraft((d) => ({ ...d, [f.key]: Number(e.target.value) }))}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-[#FAF8FF] dark:bg-white/5 border border-border-soft text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            />
            <span className="text-[11px] text-gray-400">{f.hint}</span>
          </label>
        ))}
      </div>

      <div className="px-6 pb-5">
        <label className="block max-w-xs">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Platform daily circuit breaker
          </span>
          <input
            type="number"
            min={0}
            value={draft.daily_credit_cap_platform}
            onChange={(e) => setDraft((d) => ({ ...d, daily_credit_cap_platform: Number(e.target.value) }))}
            className="mt-1 w-full px-3 py-2 rounded-lg bg-[#FEF9E7] dark:bg-amber-500/10 border border-amber-500/30 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
          <span className="text-[11px] text-gray-400">Total credits, ALL students combined, per 24h — the last line of defence</span>
        </label>
      </div>

      {error && (
        <div className="mx-6 mb-4 flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      {dirty && (
        <div className="px-6 pb-6">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-deep transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}

function AdjustModal({ student, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (sign) => {
    const n = Number(amount);
    if (!n || n <= 0) {
      setError('Enter a positive number of credits.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data, error: err } = await supabase.rpc('admin_adjust_user_credits', {
        target_user_id: student.user_id,
        p_amount: sign * n,
        p_description: reason || (sign > 0 ? 'Manual credit grant' : 'Manual credit deduction'),
      });
      if (err) throw err;
      onSaved(student.user_id, data);
    } catch (err) {
      setError(err.message || 'Failed to adjust credits.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#181818] rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-extrabold text-ink mb-1">Adjust credits</h3>
        <p className="text-sm text-body mb-4">{student.email} — currently {student.balance.toLocaleString()} credits</p>

        <label className="block mb-3">
          <span className="text-xs font-bold text-body uppercase tracking-wide">Amount</span>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 500"
            className="mt-1 w-full px-3 py-2 rounded-lg bg-[#FAF8FF] dark:bg-white/5 border border-border-soft text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </label>
        <label className="block mb-4">
          <span className="text-xs font-bold text-body uppercase tracking-wide">Reason (shown in their history)</span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Backfill for early access"
            className="mt-1 w-full px-3 py-2 rounded-lg bg-[#FAF8FF] dark:bg-white/5 border border-border-soft text-ink text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </label>

        {error && <p className="text-xs text-rose mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => submit(1)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-green text-white text-sm font-bold hover:bg-green/90 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Grant
          </button>
          <button
            onClick={() => submit(-1)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-rose text-white text-sm font-bold hover:bg-rose/90 disabled:opacity-50"
          >
            <Minus className="w-4 h-4" /> Deduct
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-3 text-xs text-gray-400 hover:text-body">Cancel</button>
      </div>
    </div>
  );
}

export default function AdminAICredits() {
  const { showToast } = useOutletContext();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [adjusting, setAdjusting] = useState(null);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.rpc('admin_get_ai_usage_summary');
      if (err) throw err;
      setRows(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load AI usage.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return (r.email || '').toLowerCase().includes(q) || (r.display_name || '').toLowerCase().includes(q);
  });

  const stats = {
    students: rows.length,
    creditsHeld: rows.reduce((sum, r) => sum + (r.balance || 0), 0),
    requests24h: rows.reduce((sum, r) => sum + Number(r.requests_24h || 0), 0),
    credits24h: rows.reduce((sum, r) => sum + Number(r.credits_24h || 0), 0),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3">
            <Zap className="w-7 h-7 text-brand" />
            AI Builder Credits
          </h1>
          <p className="text-body mt-1">The kill switch, per-student usage, and manual adjustments</p>
        </div>
        <button
          onClick={fetchUsage}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-[#181818] border border-border-soft text-body-strong hover:bg-[#FAF8FF] dark:hover:bg-white/5 transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <GatewaySwitch showToast={showToast} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Zap} label="Students with a wallet" value={stats.students} color="#7C3AED" tint="#F3EBFF" />
        <StatCard icon={Zap} label="Credits currently held" value={stats.creditsHeld.toLocaleString()} color="#16A34A" tint="#EAFAF1" />
        <StatCard icon={Zap} label="Requests, last 24h" value={stats.requests24h.toLocaleString()} color="#D9A406" tint="#FEF9E7" />
        <StatCard icon={Zap} label="Credits spent, last 24h" value={stats.credits24h.toLocaleString()} color="#E11D48" tint="#FDEEF4" />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-[#181818] border border-border text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </div>

      <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#181818]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAF8FF] dark:bg-white/5 border-b border-border-soft">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider">Student</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider">Balance</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider hidden sm:table-cell">Lifetime</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider hidden md:table-cell">Last 24h</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider hidden lg:table-cell">Last used</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                  {rows.length === 0 ? 'No student has a credit wallet yet — grants happen on purchase.' : 'No students found.'}
                </td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.user_id} className="hover:bg-[#FAF8FF] dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink truncate max-w-[180px]">{r.display_name || '—'}</p>
                      <p className="text-xs text-body flex items-center gap-1 truncate max-w-[180px]">
                        <Mail className="w-3 h-3 flex-shrink-0" /> {r.email}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-bold ${r.balance === 0 ? 'text-rose' : 'text-ink'}`}>
                        {r.balance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell text-xs text-body">
                      {r.lifetime_granted.toLocaleString()} granted · {r.lifetime_spent.toLocaleString()} spent
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-xs text-body">
                      {r.requests_24h} requests · {r.credits_24h} credits
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-xs text-body">
                      {r.last_used_at ? new Date(r.last_used_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Never'}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setAdjusting(r)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#F3EBFF] dark:hover:bg-brand/15 hover:text-brand transition-colors"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        {filtered.length} of {rows.length} students shown
      </p>

      {adjusting && (
        <AdjustModal
          student={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={(userId, newBalance) => {
            setRows((prev) => prev.map((r) => (r.user_id === userId ? { ...r, balance: newBalance } : r)));
            setAdjusting(null);
            showToast(`Balance updated to ${newBalance.toLocaleString()} credits.`);
          }}
        />
      )}
    </div>
  );
}
