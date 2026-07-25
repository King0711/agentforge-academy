import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable accounts and cloud progress sync.'
  );
}

const REMEMBER_KEY = 'sdt_remember_me';

// Respects the user's "Remember me" choice at login: when checked, the
// session token is written to localStorage (survives closing the browser).
// When unchecked, it's written to sessionStorage only (cleared when the
// tab/browser closes, so the next visit shows the login form again).
// Sign-out always removes it from both, regardless of this setting.
const rememberableStorage = {
  getItem: (key) => localStorage.getItem(key) ?? sessionStorage.getItem(key),
  setItem: (key, value) => {
    const remember = localStorage.getItem(REMEMBER_KEY) === 'true';
    (remember ? localStorage : sessionStorage).setItem(key, value);
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { storage: rememberableStorage },
    })
  : null;

export function setRememberMe(remember) {
  localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
}
