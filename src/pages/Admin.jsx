import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Shield, Zap, GraduationCap, Search, RefreshCw, Download,
  CheckCircle2, XCircle, Crown, AlertCircle, Loader2, Mail, ChevronDown, Sparkles,
  Star, Trash2, MessageSquareText, CalendarDays, Save, Send, UserX, History, ShoppingCart,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePro } from '../hooks/usePro';
import { supabase } from '../lib/supabaseClient';
import { getAgentById } from '../data/agents';
import { getDifficulty } from '../data/departments';

function StatCard({ icon: Icon, label, value, color, tint }) {
  const { theme } = useTheme();
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: theme === 'dark' ? '#181818' : tint }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white dark:bg-[#0A090F]">
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="font-display text-2xl font-extrabold text-ink">{value}</p>
        <p className="text-xs text-body">{label}</p>
      </div>
    </div>
  );
}

function isActive(expiresAt) {
  return Boolean(expiresAt) && new Date(expiresAt) > new Date();
}

// "Pro" in this admin view means paying for either Builder track — distinct
// from Admin, which means account-management privileges. A user can be both,
// or neither (yet to purchase anything).
function planLabel(u) {
  const b1 = isActive(u.builder1_expires_at);
  const b2 = isActive(u.builder2_expires_at);
  if (b1 && b2) return 'Pro (Builder 1 + 2)';
  if (b1) return 'Builder 1';
  if (b2) return 'Builder 2';
  return 'None';
}

function toCsvValue(value) {
  const str = String(value ?? '');
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function downloadUsersCsv(rows) {
  const headers = [
    'Name', 'Email', 'Admin', 'Plan', 'BYU Student', 'XP',
    'Completed Sessions', 'Builder 1 Expires', 'Builder 2 Expires', 'Joined',
  ];
  const lines = [headers.join(',')];
  for (const u of rows) {
    lines.push([
      toCsvValue(u.display_name || ''),
      toCsvValue(u.email || ''),
      toCsvValue(u.is_admin ? 'Yes' : 'No'),
      toCsvValue(u.is_admin ? '—' : planLabel(u)),
      toCsvValue(u.is_byu_student ? 'Yes' : 'No'),
      toCsvValue(u.xp ?? 0),
      toCsvValue((u.completed || []).length),
      toCsvValue(u.builder1_expires_at ? new Date(u.builder1_expires_at).toISOString() : ''),
      toCsvValue(u.builder2_expires_at ? new Date(u.builder2_expires_at).toISOString() : ''),
      toCsvValue(new Date(u.created_at).toISOString()),
    ].join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `social-dev-technologies-students-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function PlanBadge({ user }) {
  if (user.is_admin) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#FEF9E7] dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber/30 px-2 py-0.5 rounded-full">
      <Crown className="w-3 h-3" /> Admin
    </span>
  );
  const b1 = isActive(user.builder1_expires_at);
  const b2 = isActive(user.builder2_expires_at);
  if (b1 && b2) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#F3EBFF] dark:bg-brand/15 text-brand border border-brand/30 px-2 py-0.5 rounded-full">
      <Zap className="w-3 h-3" /> Pro
    </span>
  );
  if (b1) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#EAFAF1] dark:bg-green/10 text-green border border-green/20 px-2 py-0.5 rounded-full">
      Builder 1
    </span>
  );
  if (b2) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#F3EBFF] dark:bg-brand/15 text-brand border border-brand/20 px-2 py-0.5 rounded-full">
      Builder 2
    </span>
  );
  return (
    <span className="text-xs font-medium text-gray-400 border border-border-soft px-2 py-0.5 rounded-full">None</span>
  );
}

function UserRow({ u, index, expanded, onToggleExpand, actionLoading, onTogglePro, onToggleAdmin, currentUserId }) {
  const userIsPro = isActive(u.builder1_expires_at) && isActive(u.builder2_expires_at);
  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.02 }}
        className="hover:bg-[#FAF8FF] dark:hover:bg-white/5 transition-colors"
      >
        {/* User */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
              style={{ background: `hsl(${(u.email?.charCodeAt(0) || 0) * 37 % 360}, 55%, 50%)` }}
            >
              {(u.display_name || u.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-ink truncate max-w-[160px]">
                {u.display_name || '—'}
              </p>
              <p className="text-xs text-body flex items-center gap-1 truncate max-w-[160px]">
                <Mail className="w-3 h-3 flex-shrink-0" />
                {u.email}
              </p>
            </div>
          </div>
        </td>

        {/* Plan */}
        <td className="px-5 py-4">
          <PlanBadge user={u} />
        </td>

        {/* Progress */}
        <td className="px-5 py-4">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1.5 text-xs font-semibold text-body-strong hover:text-brand transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {(u.xp ?? 0).toLocaleString()} XP · {(u.completed || []).length} done
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </td>

        {/* BYU */}
        <td className="px-5 py-4 hidden sm:table-cell">
          {u.is_byu_student ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#EAFAF1] dark:bg-green/10 text-green border border-green/20 px-2 py-0.5 rounded-full">
              <GraduationCap className="w-3 h-3" /> BYU
            </span>
          ) : (
            <span className="text-gray-300 text-xs">—</span>
          )}
        </td>

        {/* Joined */}
        <td className="px-5 py-4 hidden md:table-cell text-body text-xs">
          {new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </td>

        {/* Actions */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Pro (grants/revokes both Builder 1 + 2) */}
            <button
              onClick={() => onTogglePro(u.id, userIsPro)}
              disabled={!!actionLoading || u.is_admin}
              title={userIsPro ? 'Revoke Pro' : 'Grant Pro'}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                userIsPro
                  ? 'bg-[#F3EBFF] dark:bg-brand/15 text-brand hover:bg-[#FDEEF4] dark:hover:bg-rose/10 hover:text-rose'
                  : 'bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#F3EBFF] dark:hover:bg-brand/15 hover:text-brand'
              }`}
            >
              {actionLoading === u.id + '_pro' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : userIsPro ? (
                <>
                  <XCircle className="w-3 h-3" /> Pro
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" /> Pro
                </>
              )}
            </button>

            {/* Toggle Admin */}
            <button
              onClick={() => onToggleAdmin(u.id, u.is_admin)}
              disabled={!!actionLoading || u.id === currentUserId}
              title={u.is_admin ? 'Revoke Admin' : 'Make Admin'}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                u.is_admin
                  ? 'bg-[#FEF9E7] dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-[#FDEEF4] dark:hover:bg-rose/10 hover:text-rose'
                  : 'bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#FEF9E7] dark:hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400'
              }`}
            >
              {actionLoading === u.id + '_admin' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : u.is_admin ? (
                <>
                  <Crown className="w-3 h-3" /> Admin
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3" /> Admin
                </>
              )}
            </button>
          </div>
        </td>
      </motion.tr>
      {expanded && (
        <tr className="bg-[#FAF8FF] dark:bg-white/5">
          <td colSpan={6} className="px-5 py-4">
            {(u.completed || []).length === 0 ? (
              <p className="text-xs text-gray-400">No completed sessions yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(u.completed || []).map((agentId) => {
                  const completedAgent = getAgentById(agentId);
                  if (!completedAgent) return null;
                  const diff = getDifficulty(completedAgent.difficulty);
                  return (
                    <span
                      key={agentId}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-[#181818] border border-border-soft rounded-full px-3 py-1.5"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: diff.color }}
                      />
                      {completedAgent.emoji} {completedAgent.title}
                    </span>
                  );
                })}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function TestimonialRow({ t, actionLoading, onApprove, onReject, onFeatureToggle, onDelete }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 px-5 py-4 border-b border-border-soft last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-ink text-sm">{t.display_name}</span>
          <span className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < t.rating ? 'fill-yellow text-yellow' : 'fill-gray-200 text-gray-200'}`} />
            ))}
          </span>
          {t.source === 'google_business' ? (
            <span className="text-[11px] font-semibold text-gray-500">Google review</span>
          ) : (
            <span className="text-[11px] font-semibold text-brand">Student submission</span>
          )}
          {t.approved ? (
            <span className="text-[11px] font-bold text-green bg-[#EAFAF1] dark:bg-green/10 px-2 py-0.5 rounded-full">Live</span>
          ) : (
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-[#FEF9E7] dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Pending</span>
          )}
          {t.featured && (
            <span className="text-[11px] font-bold text-brand bg-[#F3EBFF] dark:bg-brand/15 px-2 py-0.5 rounded-full">Featured</span>
          )}
        </div>
        <p className="text-sm text-body leading-relaxed">{t.body}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
        <button
          onClick={() => (t.approved ? onReject(t.id) : onApprove(t.id))}
          disabled={!!actionLoading}
          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
            t.approved
              ? 'bg-[#FDEEF4] dark:bg-rose/10 text-rose hover:bg-rose/10'
              : 'bg-green text-white hover:brightness-95'
          }`}
        >
          {actionLoading === t.id + '_approve' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : t.approved ? (
            <>
              <XCircle className="w-3 h-3" /> Unpublish
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3" /> Approve
            </>
          )}
        </button>
        <button
          onClick={() => onFeatureToggle(t.id, t.featured)}
          disabled={!!actionLoading || !t.approved}
          title={t.approved ? 'Toggle featured' : 'Approve first'}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#F3EBFF] dark:hover:bg-brand/15 hover:text-brand transition-colors disabled:opacity-40"
        >
          {t.featured ? 'Unfeature' : 'Feature'}
        </button>
        <button
          onClick={() => onDelete(t.id)}
          disabled={!!actionLoading}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#FDEEF4] dark:hover:bg-rose/10 hover:text-rose transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function CohortDateRow({ label, value, onChange, onSave, saving }) {
  return (
    <div className="flex items-center gap-3 flex-wrap px-5 py-4 border-b border-border-soft last:border-b-0">
      <span className="font-semibold text-ink text-sm w-28 flex-shrink-0">{label}</span>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-border text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
      />
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-brand hover:bg-brand-deep disabled:opacity-40 text-white transition-colors"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Save
      </button>
      {value && (
        <span className="text-xs text-body">
          Shown to students as: <strong>{new Date(value + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
        </span>
      )}
    </div>
  );
}

// Broadcast composer takes plain text — turn it into minimal safe HTML
// (paragraph breaks only) rather than asking admins to hand-write HTML.
function plainTextToHtml(text) {
  return text
    .split(/\n{2,}/)
    .map((para) => `<p style="font-size:15px;color:#3A3358;line-height:1.6;margin:0 0 16px;">${para.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

function AutomationToggle({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 py-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-brand w-4 h-4 mt-0.5 flex-shrink-0"
      />
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs text-body">{description}</span>
      </span>
    </label>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const { isAdmin, proLoading } = usePro();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [cohortDates, setCohortDates] = useState({ builder1: '', builder2: '' });
  const [cohortSaving, setCohortSaving] = useState(null);

  // Email communications
  const [emailSettings, setEmailSettings] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [inactiveLoading, setInactiveLoading] = useState(true);
  const [emailLog, setEmailLog] = useState([]);
  const [emailLogLoading, setEmailLogLoading] = useState(true);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastSegment, setBroadcastSegment] = useState('all');
  const [sendingType, setSendingType] = useState(null); // 'broadcast' | 'winback' | 'abandoned_checkout' | 'cohort_reminder' | null

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.rpc('admin_get_all_profiles');
      if (err) throw err;
      setUsers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTestimonials = useCallback(async () => {
    setTestimonialsLoading(true);
    try {
      const { data, error: err } = await supabase.rpc('admin_list_testimonials');
      if (err) throw err;
      setTestimonials(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load testimonials.');
    } finally {
      setTestimonialsLoading(false);
    }
  }, []);

  const fetchCohortSchedule = useCallback(async () => {
    try {
      const { data, error: err } = await supabase.from('cohort_schedule').select('tier, start_date');
      if (err) throw err;
      const next = { builder1: '', builder2: '' };
      for (const row of data || []) {
        next[row.tier] = row.start_date || '';
      }
      setCohortDates(next);
    } catch (err) {
      setError(err.message || 'Failed to load cohort schedule.');
    }
  }, []);

  const fetchEmailSettings = useCallback(async () => {
    try {
      const { data, error: err } = await supabase.rpc('admin_get_email_settings');
      if (err) throw err;
      const row = data?.[0];
      if (row) setEmailSettings(row);
    } catch (err) {
      setError(err.message || 'Failed to load email settings.');
    }
  }, []);

  const fetchInactiveUsers = useCallback(async (days) => {
    setInactiveLoading(true);
    try {
      const { data, error: err } = await supabase.rpc('admin_get_inactive_users', { p_days: days });
      if (err) throw err;
      setInactiveUsers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load inactive users.');
    } finally {
      setInactiveLoading(false);
    }
  }, []);

  const fetchEmailLog = useCallback(async () => {
    setEmailLogLoading(true);
    try {
      const { data, error: err } = await supabase.rpc('admin_get_email_log', { p_limit: 20 });
      if (err) throw err;
      setEmailLog(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load email log.');
    } finally {
      setEmailLogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (proLoading) return;
    if (!user || !isAdmin) {
      navigate('/', { replace: true });
      return;
    }
    fetchUsers();
    fetchTestimonials();
    fetchCohortSchedule();
    fetchEmailSettings();
    fetchEmailLog();
  }, [user, isAdmin, proLoading, navigate, fetchUsers, fetchTestimonials, fetchCohortSchedule, fetchEmailSettings, fetchEmailLog]);

  // Re-run the inactive-users lookup whenever the configured threshold
  // changes (loaded from settings, or edited by the admin).
  useEffect(() => {
    if (emailSettings?.winback_inactive_days) {
      fetchInactiveUsers(emailSettings.winback_inactive_days);
    }
  }, [emailSettings?.winback_inactive_days, fetchInactiveUsers]);

  const saveCohortDate = async (tier) => {
    setCohortSaving(tier);
    try {
      const { error: err } = await supabase
        .from('cohort_schedule')
        .update({ start_date: cohortDates[tier] || null })
        .eq('tier', tier);
      if (err) throw err;
      showToast(`${tier === 'builder1' ? 'Builder 1' : 'Builder 2'} cohort date saved.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCohortSaving(null);
    }
  };

  const setTestimonialApproved = async (id, approved) => {
    setActionLoading(id + '_approve');
    try {
      const { error: err } = await supabase.rpc('admin_set_testimonial_approved', {
        testimonial_id: id,
        set_approved: approved,
      });
      if (err) throw err;
      setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, approved } : t)));
      showToast(approved ? 'Testimonial published.' : 'Testimonial unpublished.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleTestimonialFeatured = async (id, currentFeatured) => {
    setActionLoading(id + '_feature');
    try {
      const { error: err } = await supabase.rpc('admin_set_testimonial_featured', {
        testimonial_id: id,
        set_featured: !currentFeatured,
      });
      if (err) throw err;
      setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, featured: !currentFeatured } : t)));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteTestimonial = async (id) => {
    if (!window.confirm('Delete this testimonial permanently?')) return;
    setActionLoading(id + '_delete');
    try {
      const { error: err } = await supabase.rpc('admin_delete_testimonial', { testimonial_id: id });
      if (err) throw err;
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      showToast('Testimonial deleted.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const togglePro = async (targetId, currentPro) => {
    setActionLoading(targetId + '_pro');
    try {
      const { error: err } = await supabase.rpc('admin_set_user_pro', {
        target_user_id: targetId,
        set_pro: !currentPro,
      });
      if (err) throw err;
      const expiry = !currentPro ? new Date(Date.now() + 182 * 24 * 60 * 60 * 1000).toISOString() : null;
      setUsers((prev) => prev.map((u) =>
        u.id === targetId ? { ...u, builder1_expires_at: expiry, builder2_expires_at: expiry } : u
      ));
      showToast(!currentPro ? 'Pro access granted (Builder 1 + 2, 6 months).' : 'Pro access revoked.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAdmin = async (targetId, currentAdmin) => {
    setActionLoading(targetId + '_admin');
    try {
      const { error: err } = await supabase.rpc('admin_set_user_admin', {
        target_user_id: targetId,
        set_admin: !currentAdmin,
      });
      if (err) throw err;
      setUsers((prev) => prev.map((u) =>
        u.id === targetId ? { ...u, is_admin: !currentAdmin } : u
      ));
      showToast(!currentAdmin ? 'Admin access granted.' : 'Admin access revoked.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const saveEmailSettings = async () => {
    if (!emailSettings) return;
    setSettingsSaving(true);
    try {
      const { error: err } = await supabase.rpc('admin_update_email_settings', {
        p_winback_inactive_days: emailSettings.winback_inactive_days,
        p_winback_automation_enabled: emailSettings.winback_automation_enabled,
        p_abandoned_checkout_automation_enabled: emailSettings.abandoned_checkout_automation_enabled,
        p_cohort_reminder_automation_enabled: emailSettings.cohort_reminder_automation_enabled,
      });
      if (err) throw err;
      showToast('Email settings saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  // All four of these hit a real send endpoint that emails actual students —
  // confirm before firing, same as the destructive testimonial-delete action.
  const invokeEmailFunction = async (fnName, body, confirmMessage, type) => {
    if (!window.confirm(confirmMessage)) return false;
    setSendingType(type);
    setError('');
    try {
      const { data, error: err } = await supabase.functions.invoke(fnName, { body: body || {} });
      if (err) throw err;
      showToast(`Sent to ${data?.sent ?? 0} of ${data?.matched ?? 0} matched recipients.`);
      fetchEmailLog();
      if (type === 'winback' && emailSettings) fetchInactiveUsers(emailSettings.winback_inactive_days);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to send.');
      return false;
    } finally {
      setSendingType(null);
    }
  };

  const sendBroadcastNow = async () => {
    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
      setError('Subject and message are required for a broadcast.');
      return;
    }
    const segmentLabel = { all: 'everyone', builder1: 'Builder 1 students', builder2: 'Builder 2 students', pro: 'Pro students' }[broadcastSegment];
    const ok = await invokeEmailFunction(
      'send-broadcast-email',
      { subject: broadcastSubject, html: plainTextToHtml(broadcastBody), segment: broadcastSegment },
      `Send this broadcast to ${segmentLabel} right now? This cannot be undone.`,
      'broadcast',
    );
    if (ok) {
      setBroadcastSubject('');
      setBroadcastBody('');
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.email || '').toLowerCase().includes(q) ||
      (u.display_name || '').toLowerCase().includes(q)
    );
  });

  const [now] = useState(() => Date.now());
  const stats = {
    total: users.length,
    admins: users.filter((u) => u.is_admin).length,
    pro: users.filter((u) => !u.is_admin && (isActive(u.builder1_expires_at) || isActive(u.builder2_expires_at))).length,
    thisWeek: users.filter((u) => {
      const d = new Date(u.created_at);
      return now - d.getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length,
  };

  if (proLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3">
              <Shield className="w-7 h-7 text-brand" />
              Admin Dashboard
            </h1>
            <p className="text-body mt-1">Manage all users, plans, and access</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadUsersCsv(filtered)}
              disabled={loading || filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-[#181818] border border-border-soft text-body-strong hover:bg-[#FAF8FF] dark:hover:bg-white/5 transition-colors text-sm font-medium disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-[#181818] border border-border-soft text-body-strong hover:bg-[#FAF8FF] dark:hover:bg-white/5 transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total Users" value={stats.total} color="#7C3AED" tint="#F3EBFF" />
          <StatCard icon={Crown} label="Admins" value={stats.admins} color="#D9A406" tint="#FEF9E7" />
          <StatCard icon={Zap} label="Pro (Builder 1 or 2)" value={stats.pro} color="#16A34A" tint="#EAFAF1" />
          <StatCard icon={Users} label="Joined This Week" value={stats.thisWeek} color="#E11D48" tint="#FDEEF4" />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-[#181818] border border-border text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#181818]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAF8FF] dark:bg-white/5 border-b border-border-soft">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider">Plan</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider">Progress</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider hidden sm:table-cell">BYU</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider hidden md:table-cell">Joined</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-body uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, i) => (
                    <UserRow
                      key={u.id}
                      u={u}
                      index={i}
                      expanded={expandedId === u.id}
                      onToggleExpand={() => setExpandedId((id) => (id === u.id ? null : u.id))}
                      actionLoading={actionLoading}
                      onTogglePro={togglePro}
                      onToggleAdmin={toggleAdmin}
                      currentUserId={user?.id}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          {filtered.length} of {users.length} users shown
        </p>

        {/* Cohort schedule */}
        <div className="flex items-center justify-between mt-12 mb-5">
          <h2 className="font-display text-xl font-extrabold text-ink flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-brand" />
            Cohort Schedule
          </h2>
        </div>
        <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#181818] mb-4">
          <CohortDateRow
            label="Builder 1"
            value={cohortDates.builder1}
            onChange={(v) => setCohortDates((prev) => ({ ...prev, builder1: v }))}
            onSave={() => saveCohortDate('builder1')}
            saving={cohortSaving === 'builder1'}
          />
          <CohortDateRow
            label="Builder 2"
            value={cohortDates.builder2}
            onChange={(v) => setCohortDates((prev) => ({ ...prev, builder2: v }))}
            onSave={() => saveCohortDate('builder2')}
            saving={cohortSaving === 'builder2'}
          />
        </div>
        <p className="text-xs text-gray-400 mb-2">
          Clear a date and save to hide it from the Pricing page (e.g. once that cohort has started).
        </p>

        {/* Testimonials */}
        <div className="flex items-center justify-between mt-12 mb-5">
          <h2 className="font-display text-xl font-extrabold text-ink flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-brand" />
            Testimonials
          </h2>
          {testimonials.some((t) => !t.approved) && (
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-[#FEF9E7] dark:bg-amber-500/10 px-2.5 py-1 rounded-full">
              {testimonials.filter((t) => !t.approved).length} pending
            </span>
          )}
        </div>
        <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#181818]">
          {testimonialsLoading ? (
            <div className="px-5 py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
            </div>
          ) : testimonials.length === 0 ? (
            <div className="px-5 py-12 text-center text-gray-400 text-sm">No testimonials yet.</div>
          ) : (
            testimonials.map((t) => (
              <TestimonialRow
                key={t.id}
                t={t}
                actionLoading={actionLoading}
                onApprove={(id) => setTestimonialApproved(id, true)}
                onReject={(id) => setTestimonialApproved(id, false)}
                onFeatureToggle={toggleTestimonialFeatured}
                onDelete={deleteTestimonial}
              />
            ))
          )}
        </div>

        {/* Email communications */}
        <div className="flex items-center justify-between mt-12 mb-5">
          <h2 className="font-display text-xl font-extrabold text-ink flex items-center gap-2">
            <Mail className="w-5 h-5 text-brand" />
            Email Communications
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-5 mb-5">
          {/* Broadcast composer */}
          <div className="rounded-2xl border border-border-soft bg-white dark:bg-[#181818] p-5">
            <h3 className="font-bold text-ink text-sm mb-3 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-brand" /> Send a broadcast
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                placeholder="Subject"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              <textarea
                value={broadcastBody}
                onChange={(e) => setBroadcastBody(e.target.value)}
                placeholder="Message body (plain text — blank lines start a new paragraph)"
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={broadcastSegment}
                  onChange={(e) => setBroadcastSegment(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40"
                >
                  <option value="all">Everyone</option>
                  <option value="builder1">Builder 1 students</option>
                  <option value="builder2">Builder 2 students</option>
                  <option value="pro">Pro students</option>
                </select>
                <button
                  onClick={sendBroadcastNow}
                  disabled={sendingType === 'broadcast'}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg bg-brand hover:bg-brand-deep disabled:opacity-40 text-white transition-colors ml-auto"
                >
                  {sendingType === 'broadcast' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send now
                </button>
              </div>
            </div>
          </div>

          {/* Automation settings */}
          <div className="rounded-2xl border border-border-soft bg-white dark:bg-[#181818] p-5">
            <h3 className="font-bold text-ink text-sm mb-1 flex items-center gap-1.5">
              <UserX className="w-4 h-4 text-brand" /> Win-back &amp; automation
            </h3>
            <p className="text-xs text-body mb-3">
              {inactiveLoading ? 'Checking…' : `${inactiveUsers.length} student${inactiveUsers.length === 1 ? '' : 's'} currently inactive`}
              {emailSettings ? ` (${emailSettings.winback_inactive_days}+ days since last login)` : ''}
            </p>
            {emailSettings && (
              <>
                <label className="block text-xs font-semibold text-body-strong mb-1.5">Inactive threshold (days)</label>
                <input
                  type="number"
                  min={1}
                  value={emailSettings.winback_inactive_days}
                  onChange={(e) => setEmailSettings((s) => ({ ...s, winback_inactive_days: Number(e.target.value) || 1 }))}
                  className="w-24 px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40 mb-2"
                />
                <div className="divide-y divide-border-soft border-t border-border-soft mt-1">
                  <AutomationToggle
                    label="Automatic win-back emails"
                    description="Runs weekly (Mondays) for students inactive past the threshold above."
                    checked={emailSettings.winback_automation_enabled}
                    onChange={(v) => setEmailSettings((s) => ({ ...s, winback_automation_enabled: v }))}
                  />
                  <AutomationToggle
                    label="Automatic abandoned-checkout emails"
                    description="Runs daily for anyone who started checkout 2+ hours ago and never completed it."
                    checked={emailSettings.abandoned_checkout_automation_enabled}
                    onChange={(v) => setEmailSettings((s) => ({ ...s, abandoned_checkout_automation_enabled: v }))}
                  />
                  <AutomationToggle
                    label="Automatic cohort-start reminders"
                    description="Runs daily for students whose paid cohort starts within 3 days."
                    checked={emailSettings.cohort_reminder_automation_enabled}
                    onChange={(v) => setEmailSettings((s) => ({ ...s, cohort_reminder_automation_enabled: v }))}
                  />
                </div>
                <button
                  onClick={saveEmailSettings}
                  disabled={settingsSaving}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-brand hover:bg-brand-deep disabled:opacity-40 text-white transition-colors mt-3"
                >
                  {settingsSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save settings
                </button>
              </>
            )}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border-soft">
              <button
                onClick={() => invokeEmailFunction('send-winback-emails', {}, `Send a win-back email to ${inactiveUsers.length} inactive student${inactiveUsers.length === 1 ? '' : 's'} right now?`, 'winback')}
                disabled={!!sendingType || inactiveUsers.length === 0}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#F3EBFF] dark:hover:bg-brand/15 hover:text-brand transition-colors disabled:opacity-40"
              >
                {sendingType === 'winback' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                Send win-back now
              </button>
              <button
                onClick={() => invokeEmailFunction('send-abandoned-checkout-emails', {}, 'Send abandoned-checkout reminders to everyone currently eligible?', 'abandoned_checkout')}
                disabled={!!sendingType}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#F3EBFF] dark:hover:bg-brand/15 hover:text-brand transition-colors disabled:opacity-40"
              >
                {sendingType === 'abandoned_checkout' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                Send abandoned-checkout now
              </button>
              <button
                onClick={() => invokeEmailFunction('send-cohort-reminder-emails', {}, 'Send cohort-start reminders to everyone currently eligible?', 'cohort_reminder')}
                disabled={!!sendingType}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#F3EBFF] dark:hover:bg-brand/15 hover:text-brand transition-colors disabled:opacity-40"
              >
                {sendingType === 'cohort_reminder' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarDays className="w-3.5 h-3.5" />}
                Send cohort reminder now
              </button>
            </div>
          </div>
        </div>

        {/* Email log */}
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-brand" />
          <h3 className="font-bold text-ink text-sm">Recent sends</h3>
        </div>
        <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#181818]">
          {emailLogLoading ? (
            <div className="px-5 py-8 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-brand mx-auto" />
            </div>
          ) : emailLog.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No emails sent yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF8FF] dark:bg-white/5 border-b border-border-soft">
                    <th className="text-left px-5 py-2.5 text-xs font-bold text-body uppercase tracking-wider">Recipient</th>
                    <th className="text-left px-5 py-2.5 text-xs font-bold text-body uppercase tracking-wider">Type</th>
                    <th className="text-left px-5 py-2.5 text-xs font-bold text-body uppercase tracking-wider">Subject</th>
                    <th className="text-left px-5 py-2.5 text-xs font-bold text-body uppercase tracking-wider">Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  {emailLog.map((e) => (
                    <tr key={e.id}>
                      <td className="px-5 py-2.5 text-body-strong">{e.email}</td>
                      <td className="px-5 py-2.5 text-body capitalize">{e.email_type.replace('_', ' ')}</td>
                      <td className="px-5 py-2.5 text-body truncate max-w-[240px]">{e.subject}</td>
                      <td className="px-5 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(e.sent_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green text-white text-sm font-bold px-5 py-3 rounded-xl shadow-lg"
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
}
