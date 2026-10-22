import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getStoredReferralCode } from '../lib/referral';
import { DEFAULT_AUTH_POLICY, fetchAuthPolicy, isMfaFresh, readMfaClaims } from '../lib/sessionPolicy';

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

  // ---- Two-step verification ---------------------------------------------------
  // An account with a verified authenticator app may only use the site while this
  // session has entered a code from it within auth_policy.mfa_max_age_minutes
  // (supabase/session-policy.sql). Signing in with a password or an emailed code only
  // gets a session to the "code needed" screen (MfaChallenge, rendered by AppShell);
  // nothing else renders until the code is entered. When the window runs out mid-visit
  // the same screen comes back. This is the honest-user flow: the database enforces the
  // same rule independently for admin accounts (admin_session_ok), which is what stops
  // someone who simply ignores this screen.
  //   'none'     signed out, or no authenticator on the account
  //   'checking' signed in, still finding out whether the account has one
  //   'ok'       code entered recently enough
  //   'required' a code is needed now
  const [factor, setFactor] = useState(null); // { userId, factorId | null }
  const [authPolicy, setAuthPolicy] = useState(DEFAULT_AUTH_POLICY);
  const [now, setNow] = useState(() => Date.now());
  const userId = session?.user?.id ?? null;
  const accessToken = session?.access_token ?? null;

  const lookupFactor = useCallback(async () => {
    const [factors, policy] = await Promise.all([supabase.auth.mfa.listFactors(), fetchAuthPolicy()]);
    const verified = (factors.data?.totp ?? []).find((f) => f.status === 'verified');
    // A failed lookup counts as "no authenticator": the screen is a convenience for
    // honest users, so an outage shouldn't lock everyone out of the site.
    return { factorId: verified?.id ?? null, policy };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return undefined;
    let cancelled = false;
    lookupFactor().then(({ factorId, policy }) => {
      if (cancelled) return;
      setFactor({ userId, factorId });
      setAuthPolicy(policy);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, lookupFactor]);

  // Re-check the clock when the window is due to close, and when a laptop wakes up or
  // the tab comes back (timers are throttled while hidden).
  useEffect(() => {
    if (!accessToken) return undefined;
    const { lastTotpAt } = readMfaClaims(accessToken);
    let timer;
    if (lastTotpAt) {
      const wait = Math.max(0, lastTotpAt + authPolicy.mfaMaxAgeMinutes * 60_000 - Date.now()) + 1000;
      timer = setTimeout(() => setNow(Date.now()), wait);
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [accessToken, authPolicy.mfaMaxAgeMinutes]);

  let mfaStatus = 'none';
  if (session && factor?.userId !== userId) {
    mfaStatus = 'checking';
  } else if (session && factor?.factorId) {
    mfaStatus = isMfaFresh(readMfaClaims(accessToken), authPolicy.mfaMaxAgeMinutes, now) ? 'ok' : 'required';
  }
  const mfaFactorId = factor?.userId === userId ? factor?.factorId ?? null : null;

  const verifyMfa = useCallback(async (code) => {
    if (!mfaFactorId) return { error: { message: 'No authenticator app is set up on this account.' } };
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfaFactorId, code });
    if (error) return { error };
    // The new token must show the code as entered just now. If it doesn't, sign in
    // from scratch rather than leaving the person stuck on this screen.
    const { data } = await supabase.auth.getSession();
    const claims = readMfaClaims(data.session?.access_token);
    if (!isMfaFresh(claims, authPolicy.mfaMaxAgeMinutes, Date.now())) {
      await supabase.auth.signOut();
      return { error: { message: 'Please sign in again to finish verifying.' } };
    }
    setNow(Date.now());
    return { error: null };
  }, [mfaFactorId, authPolicy.mfaMaxAgeMinutes]);

  // For after an authenticator is enrolled or removed in this visit.
  const refreshMfa = useCallback(async () => {
    if (!userId) return;
    const { factorId, policy } = await lookupFactor();
    setFactor({ userId, factorId });
    setAuthPolicy(policy);
  }, [userId, lookupFactor]);

  // Real signup + confirmation-email flow, restored now that Auth's SMTP is
  // confirmed working (verified domain on Resend, tested via the emailed
  // login-code path). This briefly went through a create-account Edge
  // Function that bypassed email confirmation entirely while SMTP was
  // broken — reverted deliberately, since that bypass let anyone sign up
  // with an email they don't own.
  const signUp = useCallback(async (email, password, displayName) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    // referral_code rides along in metadata purely for handle_new_user()
    // (referrals-setup.sql) to read at insert time — it's never written to
    // profiles directly, and a missing/invalid/expired code here just means
    // no referral gets attributed, never a failed signup.
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
          referral_code: getStoredReferralCode() || undefined,
        },
      },
    });
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

  // Sends a password-reset link to an existing account's email. Supabase
  // redirects the click to redirectTo with a recovery session already
  // attached (its client-side detectSessionInUrl handles that automatically)
  // — ResetPassword.jsx picks that session up and lets them set a new one.
  const resetPassword = useCallback(async (email) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  }, []);

  // Only valid within an active recovery session (i.e. right after landing
  // on /reset-password from the emailed link) — updateUser reuses whatever
  // session is currently active, there's no separate "recovery token" param.
  const updatePassword = useCallback(async (newPassword) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.updateUser({ password: newPassword });
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

  // For the checkout modal only (usePaystackCheckout.js / CheckoutAuthModal.jsx)
  // — unlike sendLoginCode, shouldCreateUser is true here on purpose: the
  // whole point of that flow is one email+code step that works whether
  // someone's new or returning, since a buyer mid-checkout doesn't want to
  // stop and decide "am I signing up or logging in?". /welcome's own
  // signup (password) and log-in-with-code (existing accounts only) stay
  // exactly as they are — this is an additional path, not a replacement.
  // A typed-back code is the same proof of inbox ownership as the
  // confirmation-link flow signUp() uses, so this doesn't reopen the
  // "signed up with an email they don't own" issue that flow was
  // restored to prevent.
  const sendCheckoutCode = useCallback(async (email) => {
    if (!isSupabaseConfigured) return { error: { message: 'Supabase is not configured.' } };
    return supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: {
          display_name: email.split('@')[0],
          referral_code: getStoredReferralCode() || undefined,
        },
      },
    });
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    isConfigured: isSupabaseConfigured,
    signUp,
    signIn,
    sendLoginCode,
    sendCheckoutCode,
    verifyLoginCode,
    resetPassword,
    updatePassword,
    signInWithGoogle,
    signOut,
    mfaStatus,
    mfaFactorId,
    verifyMfa,
    refreshMfa,
    authPolicy,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
