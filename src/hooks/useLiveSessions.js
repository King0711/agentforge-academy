import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// Reads live_sessions directly (RLS gates rows to the caller's active
// tier(s), or all of them for an admin) — no admin RPC needed here, that's
// only for the Admin panel's cross-tier management view.
export function useLiveSessions(user) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Splitting into upcoming/past happens once per fetch, not on every
  // render — Date.now() is an impure call, so it can't run directly in the
  // hook body without risking inconsistent results across re-renders.
  const [now, setNow] = useState(() => Date.now());

  const refetch = useCallback(async () => {
    if (!isSupabaseConfigured || !user) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('live_sessions')
      .select('id, tier, title, description, session_date, join_link, recording_url')
      .order('session_date', { ascending: true });
    if (!error) setSessions(data || []);
    setNow(Date.now());
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const upcoming = sessions.filter((s) => new Date(s.session_date).getTime() >= now);
  const past = sessions.filter((s) => new Date(s.session_date).getTime() < now);
  const replays = past.filter((s) => s.recording_url);
  const nextSession = upcoming[0] ?? null;

  return { sessions, upcoming, past, replays, nextSession, loading, refetch };
}
