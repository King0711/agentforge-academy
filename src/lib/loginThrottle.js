// Friction for the login forms: after a run of wrong passwords or codes, wait before
// trying again. This is the courtesy half of rate limiting - a script talking to
// Supabase Auth directly never sees it. The real limits on sign-in, code emails and
// code checks are Supabase Auth's own (Dashboard > Authentication > Rate Limits; see
// CLAUDE.md for the values this project should use).

const KEY = 'sdt_login_failures';
const MAX_FAILURES = 5;
const LOCK_MS = 60_000;

function read() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(KEY) ?? '{}');
    return { count: Number(raw.count) || 0, lockedUntil: Number(raw.lockedUntil) || 0 };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}

function write(state) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: no throttle, the server limits still apply.
  }
}

/** Seconds left on the current lock-out, 0 when the form is free to use. */
export function loginLockSeconds() {
  const { lockedUntil } = read();
  return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
}

export function recordLoginFailure() {
  const { count } = read();
  const next = count + 1;
  if (next >= MAX_FAILURES) write({ count: 0, lockedUntil: Date.now() + LOCK_MS });
  else write({ count: next, lockedUntil: 0 });
}

export function clearLoginFailures() {
  write({ count: 0, lockedUntil: 0 });
}

export function lockMessage(seconds) {
  return `Too many attempts. Please wait ${seconds} second${seconds === 1 ? '' : 's'} and try again.`;
}

// Supabase Auth answers 429 with these codes when its own limits trip.
export function isAuthRateLimited(err) {
  return (
    err?.status === 429 ||
    ['over_request_rate_limit', 'over_email_send_rate_limit', 'over_sms_send_rate_limit'].includes(err?.code)
  );
}

export const RATE_LIMITED_MESSAGE =
  'Too many attempts from your connection. Please wait a few minutes and try again.';
