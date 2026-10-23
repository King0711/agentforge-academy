import { supabase, isSupabaseConfigured } from './supabaseClient';

// Client side of supabase/session-policy.sql. The numbers live in public.auth_policy so
// they can be tuned without a deploy; these defaults match the SQL and are used until
// (or if) the row can't be read.
export const DEFAULT_AUTH_POLICY = {
  mfaMaxAgeMinutes: 480,
  adminIdleLockMinutes: 30,
};

let policyPromise = null;

export function fetchAuthPolicy() {
  if (!isSupabaseConfigured) return Promise.resolve(DEFAULT_AUTH_POLICY);
  if (!policyPromise) {
    policyPromise = supabase
      .from('auth_policy')
      .select('mfa_max_age_minutes, admin_idle_lock_minutes')
      .eq('id', true)
      .maybeSingle()
      .then(({ data }) => ({
        mfaMaxAgeMinutes: data?.mfa_max_age_minutes ?? DEFAULT_AUTH_POLICY.mfaMaxAgeMinutes,
        adminIdleLockMinutes: data?.admin_idle_lock_minutes ?? DEFAULT_AUTH_POLICY.adminIdleLockMinutes,
      }))
      // Not applied yet (table missing) or offline: keep the defaults, and try again
      // on the next page load rather than caching the failure.
      .catch(() => {
        policyPromise = null;
        return DEFAULT_AUTH_POLICY;
      });
  }
  return policyPromise;
}

function decodePayload(accessToken) {
  try {
    const payload = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// What the access token says about two-step verification. `amr` lists the sign-in
// methods used, each with the unix time it happened; the token is signed, so these are
// the same values the database sees in admin_session_ok().
export function readMfaClaims(accessToken) {
  const claims = accessToken ? decodePayload(accessToken) : null;
  const totp = (claims?.amr ?? [])
    .filter((entry) => entry?.method === 'totp')
    .map((entry) => Number(entry.timestamp))
    .filter(Number.isFinite);
  return {
    aal: claims?.aal ?? 'aal1',
    lastTotpAt: totp.length ? Math.max(...totp) * 1000 : 0, // ms since epoch, 0 = never
  };
}

// True when this session has proven a code from the authenticator app recently enough.
export function isMfaFresh(claims, maxAgeMinutes, nowMs) {
  return claims.aal === 'aal2' && claims.lastTotpAt >= nowMs - maxAgeMinutes * 60_000;
}
