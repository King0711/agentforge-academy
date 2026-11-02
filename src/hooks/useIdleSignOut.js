import { useEffect } from 'react';

// Calls onIdle once the person has gone `minutes` without touching the page. Activity is
// shared across tabs through localStorage, so working in one admin tab doesn't get the
// other one signed out. The browser can't see inside a locked computer, which is why
// supabase/session-policy.sql also ends idle admin sessions from the server side; this
// is the quicker, finer-grained half.
const ACTIVITY_KEY = 'sdt_last_activity';
const EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
const WRITE_EVERY_MS = 5_000;
const CHECK_EVERY_MS = 15_000;

function readLastActivity() {
  try {
    return Number(localStorage.getItem(ACTIVITY_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeLastActivity(at) {
  try {
    localStorage.setItem(ACTIVITY_KEY, String(at));
  } catch {
    // Storage blocked: this tab still tracks its own activity below.
  }
}

export function useIdleSignOut(minutes, onIdle) {
  useEffect(() => {
    if (!minutes) return undefined;
    const limitMs = minutes * 60_000;
    let lastWrite = Date.now();
    let lastLocal = lastWrite;
    writeLastActivity(lastWrite); // opening the page counts as activity

    const onActivity = () => {
      const at = Date.now();
      lastLocal = at;
      if (at - lastWrite > WRITE_EVERY_MS) {
        lastWrite = at;
        writeLastActivity(at);
      }
    };
    const check = () => {
      const lastSeen = Math.max(readLastActivity(), lastLocal);
      if (Date.now() - lastSeen > limitMs) onIdle();
    };

    EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
    document.addEventListener('visibilitychange', check);
    const timer = setInterval(check, CHECK_EVERY_MS);
    return () => {
      EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
      document.removeEventListener('visibilitychange', check);
      clearInterval(timer);
    };
  }, [minutes, onIdle]);
}
