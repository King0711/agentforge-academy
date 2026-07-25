import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Shield, Zap, GraduationCap, Search, RefreshCw, Download,
  CheckCircle2, XCircle, Crown, AlertCircle, Loader2, Mail, ChevronDown, Sparkles,
  Star, Trash2, MessageSquareText, CalendarDays, Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePro } from '../hooks/usePro';
import { supabase } from '../lib/supabaseClient';
import { getAgentById } from '../data/agents';
import { getDifficulty } from '../data/departments';

function StatCard({ icon: Icon, label, value, color, tint }) {
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: tint }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-white">
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
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#FEF9E7] text-amber-700 border border-amber/30 px-2 py-0.5 rounded-full">
      <Crown className="w-3 h-3" /> Admin
    </span>
  );
  const b1 = isActive(user.builder1_expires_at);
  const b2 = isActive(user.builder2_expires_at);
  if (b1 && b2) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#F3EBFF] text-brand border border-brand/30 px-2 py-0.5 rounded-full">
      <Zap className="w-3 h-3" /> Pro
    </span>
  );
  if (b1) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#EAFAF1] text-green border border-green/20 px-2 py-0.5 rounded-full">
      Builder 1
    </span>
  );
  if (b2) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#F3EBFF] text-brand border border-brand/20 px-2 py-0.5 rounded-full">
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
        className="hover:bg-[#FAF8FF] transition-colors"
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
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#EAFAF1] text-green border border-green/20 px-2 py-0.5 rounded-full">
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
                  ? 'bg-[#F3EBFF] text-brand hover:bg-[#FDEEF4] hover:text-rose'
                  : 'bg-[#FAF8FF] text-body-strong hover:bg-[#F3EBFF] hover:text-brand'
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
                  ? 'bg-[#FEF9E7] text-amber-700 hover:bg-[#FDEEF4] hover:text-rose'
                  : 'bg-[#FAF8FF] text-body-strong hover:bg-[#FEF9E7] hover:text-amber-700'
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
        <tr className="bg-[#FAF8FF]">
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
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-border-soft rounded-full px-3 py-1.5"
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
            <span className="text-[11px] font-semibold text-gray-400">Google review</span>
          ) : (
            <span className="text-[11px] font-semibold text-brand">Student submission</span>
          )}
          {t.approved ? (
            <span className="text-[11px] font-bold text-green bg-[#EAFAF1] px-2 py-0.5 rounded-full">Live</span>
          ) : (
            <span className="text-[11px] font-bold text-amber-700 bg-[#FEF9E7] px-2 py-0.5 rounded-full">Pending</span>
          )}
          {t.featured && (
            <span className="text-[11px] font-bold text-brand bg-[#F3EBFF] px-2 py-0.5 rounded-full">Featured</span>
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
              ? 'bg-[#FDEEF4] text-rose hover:bg-rose/10'
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
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FAF8FF] text-body-strong hover:bg-[#F3EBFF] hover:text-brand transition-colors disabled:opacity-40"
        >
          {t.featured ? 'Unfeature' : 'Feature'}
        </button>
        <button
          onClick={() => onDelete(t.id)}
          disabled={!!actionLoading}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FAF8FF] text-body-strong hover:bg-[#FDEEF4] hover:text-rose transition-colors disabled:opacity-40"
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

  useEffect(() => {
    if (proLoading) return;
    if (!user || !isAdmin) {
      navigate('/', { replace: true });
      return;
    }
    fetchUsers();
    fetchTestimonials();
    fetchCohortSchedule();
  }, [user, isAdmin, proLoading, navigate, fetchUsers, fetchTestimonials, fetchCohortSchedule]);

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
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-border-soft text-body-strong hover:bg-[#FAF8FF] transition-colors text-sm font-medium disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-border-soft text-body-strong hover:bg-[#FAF8FF] transition-colors text-sm font-medium"
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
          <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] border border-rose/20 rounded-lg px-4 py-3 mb-6">
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
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-border text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border-soft overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAF8FF] border-b border-border-soft">
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
        <div className="rounded-2xl border border-border-soft overflow-hidden bg-white mb-4">
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
            <span className="text-xs font-bold text-amber-700 bg-[#FEF9E7] px-2.5 py-1 rounded-full">
              {testimonials.filter((t) => !t.approved).length} pending
            </span>
          )}
        </div>
        <div className="rounded-2xl border border-border-soft overflow-hidden bg-white">
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
