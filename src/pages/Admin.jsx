import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Shield, Zap, GraduationCap, Search, RefreshCw,
  CheckCircle2, XCircle, Crown, AlertCircle, Loader2, Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePro } from '../hooks/usePro';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function PlanBadge({ user }) {
  if (user.is_admin) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
      <Crown className="w-3 h-3" /> Admin
    </span>
  );
  if (user.is_pro) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#0067B8]/20 text-[#3FA9F5] border border-[#0067B8]/30 px-2 py-0.5 rounded-full">
      <Zap className="w-3 h-3" /> Pro
    </span>
  );
  return (
    <span className="text-xs font-medium text-slate-500 border border-white/10 px-2 py-0.5 rounded-full">Free</span>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const { isPro, isAdmin, proLoading } = usePro();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

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

  useEffect(() => {
    if (proLoading) return;
    if (!user || !isAdmin) {
      navigate('/', { replace: true });
      return;
    }
    fetchUsers();
  }, [user, isAdmin, proLoading, navigate, fetchUsers]);

  const togglePro = async (targetId, currentPro) => {
    setActionLoading(targetId + '_pro');
    try {
      const { error: err } = await supabase.rpc('admin_set_user_pro', {
        target_user_id: targetId,
        set_pro: !currentPro,
      });
      if (err) throw err;
      setUsers((prev) => prev.map((u) =>
        u.id === targetId ? { ...u, is_pro: !currentPro } : u
      ));
      showToast(!currentPro ? 'Pro access granted.' : 'Pro access revoked.');
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

  const stats = {
    total: users.length,
    pro: users.filter((u) => u.is_pro || u.is_admin).length,
    byu: users.filter((u) => u.is_byu_student).length,
    thisWeek: users.filter((u) => {
      const d = new Date(u.created_at);
      return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length,
  };

  if (proLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0067B8]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <Shield className="w-7 h-7 text-amber-400" />
              Admin Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Manage all users, plans, and access</p>
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total Users" value={stats.total} color="#0067B8" />
          <StatCard icon={Zap} label="Pro / Admin" value={stats.pro} color="#7C3AED" />
          <StatCard icon={GraduationCap} label="BYU Students" value={stats.byu} color="#10B981" />
          <StatCard icon={Users} label="Joined This Week" value={stats.thisWeek} color="#F59E0B" />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-300 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0067B8]"
          />
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/[0.04] border-b border-white/10">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Plan</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:table-cell">BYU</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell">Joined</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-[#0067B8] mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="bg-white/[0.01] hover:bg-white/[0.04] transition-colors"
                    >
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                            style={{ background: `hsl(${(u.email?.charCodeAt(0) || 0) * 37 % 360}, 60%, 40%)` }}
                          >
                            {(u.display_name || u.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate max-w-[160px]">
                              {u.display_name || '—'}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-[160px]">
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

                      {/* BYU */}
                      <td className="px-5 py-4 hidden sm:table-cell">
                        {u.is_byu_student ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                            <GraduationCap className="w-3 h-3" /> BYU
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-4 hidden md:table-cell text-slate-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Toggle Pro */}
                          <button
                            onClick={() => togglePro(u.id, u.is_pro)}
                            disabled={!!actionLoading || u.is_admin}
                            title={u.is_pro ? 'Revoke Pro' : 'Grant Pro'}
                            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                              u.is_pro
                                ? 'bg-[#0067B8]/20 text-[#3FA9F5] hover:bg-red-400/20 hover:text-red-300'
                                : 'bg-white/5 text-slate-300 hover:bg-[#0067B8]/20 hover:text-[#3FA9F5]'
                            }`}
                          >
                            {actionLoading === u.id + '_pro' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : u.is_pro ? (
                              <><XCircle className="w-3 h-3" /> Pro</>
                            ) : (
                              <><CheckCircle2 className="w-3 h-3" /> Pro</>
                            )}
                          </button>

                          {/* Toggle Admin */}
                          <button
                            onClick={() => toggleAdmin(u.id, u.is_admin)}
                            disabled={!!actionLoading || u.id === user?.id}
                            title={u.is_admin ? 'Revoke Admin' : 'Make Admin'}
                            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                              u.is_admin
                                ? 'bg-amber-400/15 text-amber-300 hover:bg-red-400/20 hover:text-red-300'
                                : 'bg-white/5 text-slate-300 hover:bg-amber-400/15 hover:text-amber-300'
                            }`}
                          >
                            {actionLoading === u.id + '_admin' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : u.is_admin ? (
                              <><Crown className="w-3 h-3" /> Admin</>
                            ) : (
                              <><Shield className="w-3 h-3" /> Admin</>
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-600 mt-4 text-center">
          {filtered.length} of {users.length} users shown
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-lg"
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
}
