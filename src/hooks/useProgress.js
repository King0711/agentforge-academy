import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_KEY = 'agentforge_progress_v1';

const defaultState = {
  completed: [], // array of agent ids
  xp: 0,
  lastVisit: null,
  streak: 0,
  history: [], // [{ id, title, xp, date }]
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultState };
    const parsed = JSON.parse(raw);
    return { ...defaultState, ...parsed };
  } catch {
    return { ...defaultState };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore write errors (private mode, etc.)
  }
}

function computeStreak(state) {
  const today = new Date().toDateString();
  if (!state.lastVisit) {
    return { ...state, lastVisit: today, streak: 1 };
  }
  if (state.lastVisit === today) {
    return state;
  }
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (state.lastVisit === yesterday) {
    return { ...state, lastVisit: today, streak: state.streak + 1 };
  }
  return { ...state, lastVisit: today, streak: 1 };
}

function fromRow(row) {
  return computeStreak({
    completed: row.completed || [],
    xp: row.xp || 0,
    streak: row.streak || 0,
    lastVisit: row.last_visit || null,
    history: row.history || [],
  });
}

function toRow(userId, state) {
  return {
    user_id: userId,
    xp: state.xp,
    streak: state.streak,
    last_visit: state.lastVisit,
    completed: state.completed,
    history: state.history,
  };
}

/**
 * Tracks XP, streaks, completed agents, and history.
 * Persists to localStorage when signed out, and syncs to Supabase
 * (table `progress`, one row per user_id) when signed in.
 */
export function useProgress(user) {
  const [state, setState] = useState(() => computeStreak(loadState()));
  const userId = user?.id ?? null;
  const readyRef = useRef(!userId); // local mode is ready immediately

  // When auth state changes, load the right source of truth.
  useEffect(() => {
    let cancelled = false;
    readyRef.current = false;

    if (!userId || !isSupabaseConfigured) {
      setState(computeStreak(loadState()));
      readyRef.current = true;
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (cancelled) return;

      if (!error && data) {
        setState(fromRow(data));
      } else {
        // First time this user is seen — seed cloud progress from local progress (if any)
        const local = computeStreak(loadState());
        await supabase.from('progress').upsert(toRow(userId, local));
        setState(local);
      }
      readyRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Persist on every change, to whichever store is active.
  useEffect(() => {
    if (!readyRef.current) return;

    if (userId && isSupabaseConfigured) {
      supabase.from('progress').upsert(toRow(userId, state)).then(({ error }) => {
        if (error) console.error('Failed to sync progress:', error.message);
      });
    } else {
      saveState(state);
    }
  }, [state, userId]);

  const isCompleted = useCallback((id) => state.completed.includes(id), [state.completed]);

  const toggleComplete = useCallback((agent) => {
    setState((prev) => {
      const isDone = prev.completed.includes(agent.id);
      if (isDone) {
        return {
          ...prev,
          completed: prev.completed.filter((id) => id !== agent.id),
          xp: Math.max(0, prev.xp - agent.xp),
          history: prev.history.filter((h) => h.id !== agent.id),
        };
      }
      return {
        ...prev,
        completed: [...prev.completed, agent.id],
        xp: prev.xp + agent.xp,
        history: [
          { id: agent.id, title: agent.title, xp: agent.xp, date: new Date().toISOString() },
          ...prev.history,
        ].slice(0, 50),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({ ...defaultState, lastVisit: new Date().toDateString(), streak: 1 });
  }, []);

  return {
    completed: state.completed,
    xp: state.xp,
    streak: state.streak,
    history: state.history,
    isCompleted,
    toggleComplete,
    reset,
  };
}
