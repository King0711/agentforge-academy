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
      .select('id, tier, title, description, session_date, join_link, recording_url, recording_passcode')
      .order('session_date', { ascending: true });
    if (!error) setSessions(data || []);
    setNow(Date.now());
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Join links (Home banner, Live Sessions list, Jump back in) stay visible
  // for this long past session_date — the class itself runs for a while
  // after the start time, so the link shouldn't vanish the instant it
  // begins. No per-session duration column exists yet, so this is a flat
  // default rather than something read per row.
  const SESSION_DURATION_MS = 2.5 * 60 * 60 * 1000; // 2.5 hours

  const upcoming = sessions.filter((s) => new Date(s.session_date).getTime() + SESSION_DURATION_MS >= now);
  const past = sessions.filter((s) => new Date(s.session_date).getTime() + SESSION_DURATION_MS < now);
  const replays = past.filter((s) => s.recording_url);
  const nextSession = upcoming[0] ?? null;

  return { sessions, upcoming, past, replays, nextSession, loading, refetch };
}
