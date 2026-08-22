// Referral-link capture. Attribution is link-only (?ref=CODE) — there is
// deliberately no manual "enter a referral code" field anywhere, so this is
// the one path into the referrals table the signup trigger
// (handle_new_user in referrals-setup.sql) trusts.
//
// Split into pure functions (parsing, validation, the stored-record shape)
// and thin wrappers around window.location/localStorage, so the logic that
// actually matters is unit-testable without a DOM.

export const REFERRAL_STORAGE_KEY = 'sdt_referral';

// A referred visitor might land on any page, not just /welcome, and could
// browse for a while before signing up — 30 days is generous enough to
// survive that gap without keeping a years-old code alive forever.
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Codes are only ever minted by get_or_create_my_referral_code() as
// <up to 8 uppercase letters><4 uppercase hex chars>. This pattern is a
// sanity filter against a stray/garbage ?ref= value, not a security
// boundary — the database is what actually validates a code at signup.
const CODE_PATTERN = /^[A-Z0-9]{4,20}$/;

/** Extracts and validates a ?ref= code from a query string, or null. */
export function parseReferralCode(search) {
  if (!search) return null;
  const raw = new URLSearchParams(search).get('ref');
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

/** The JSON shape written to storage — exported so tests can round-trip it. */
export function buildReferralRecord(code, now = Date.now()) {
  return JSON.stringify({ code, capturedAt: now });
}

/** Reads a stored record back to a code, or null if missing/malformed/expired. */
export function readStoredReferralCode(rawStored, now = Date.now()) {
  if (!rawStored) return null;
  let parsed;
  try {
    parsed = JSON.parse(rawStored);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed.code !== 'string' || typeof parsed.capturedAt !== 'number') {
    return null;
  }
  if (now - parsed.capturedAt > MAX_AGE_MS) return null;
  return parsed.code;
}

/** Call once per page load. No-ops if there's no ?ref= or it looks invalid. */
export function captureReferralFromLocation() {
  if (typeof window === 'undefined') return;
  const code = parseReferralCode(window.location.search);
  if (!code) return;
  try {
    window.localStorage.setItem(REFERRAL_STORAGE_KEY, buildReferralRecord(code));
  } catch {
    // Private browsing / storage full / disabled — losing attribution
    // silently is fine; it's not worth surfacing an error over.
  }
}

/** The code to attach at signup, if any was captured and hasn't expired. */
export function getStoredReferralCode() {
  if (typeof window === 'undefined') return null;
  try {
    return readStoredReferralCode(window.localStorage.getItem(REFERRAL_STORAGE_KEY));
  } catch {
    return null;
  }
}
