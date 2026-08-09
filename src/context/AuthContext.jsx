import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // loading already initialized to false in this case — nothing to sync.
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Goes through the create-account Edge Function (admin API, email
  // pre-confirmed) rather than supabase.auth.signUp() directly — Auth's own
  // signup-confirmation email currently can't be delivered (the Resend
  // account behind Auth's SMTP settings is sandboxed to one verified
  // address), which was silently failing every real signup. See CLAUDE.md.
  const signUp = useCallback(async (email, password, displayName) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    const { error: err, response } = await supabase.functions.invoke('create-account', {
      body: { email, password, displayName },
    });
    if (err) {
      let message = 'Something went wrong creating your account.';
      try {
        const body = await response?.json();
        if (body?.error) message = body.error;
      } catch {
        // response body wasn't JSON (e.g. a network-level failure) — fall
        // back to the generic message above.
      }
      return { error: { message } };
    }
    // Account already exists and is confirmed — sign in immediately to
    // establish a real session, same as the password-login path.
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  // Sends a 6-digit login code to an existing account's email — an
  // alternative to typing a password. shouldCreateUser is false so this
  // never silently creates a new account; sign-up stays its own explicit step.
  const sendLoginCode = useCallback(async (email) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  }, []);

  const verifyLoginCode = useCallback(async (email, token) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.verifyOtp({ email, token, type: 'email' });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        // Always show Google's account chooser rather than silently
        // completing with whichever Google account is already active in
        // the browser — gives the user a visible, deliberate step.
        queryParams: { prompt: 'select_account' },
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: null };
    return supabase.auth.signOut();
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    isConfigured: isSupabaseConfigured,
    signUp,
    signIn,
    sendLoginCode,
    verifyLoginCode,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
