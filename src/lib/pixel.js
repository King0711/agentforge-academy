// Meta Pixel events. The pixel itself is the inline script in index.html (its
// sha256 is pinned in vercel.json's CSP, so that script must not be edited);
// everything here only calls window.fbq, which that script defines. Every
// helper no-ops when fbq is missing (blocked by an ad blocker, or not loaded
// yet), so a blocked pixel can never break a page.
//
// Never pass personal data (emails, names, phone numbers) as parameters.

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { trackCoursePaid } from './coursePageTracking';
import {
  BUILDER1_PRICE, BUILDER2_PRICE, PRO_PRICE, VIBECODING_PRICE, AI_AGENT_MASTERY_PRICE,
} from '../data/pricing';

const CURRENCY = 'NGN';

function fbq(...args) {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') window.fbq(...args);
  } catch {
    // Tracking must never throw into the app.
  }
}

// Standard Meta events (Lead, Purchase, ...) — Meta can optimise ads on these.
export function pixelTrack(event, params, eventId) {
  fbq('track', event, params || {}, eventId ? { eventID: eventId } : undefined);
}

// One unique id per event. The browser pixel (eventID) and the server copy sent
// through the Conversions API carry the same one, which is how Meta merges them
// into a single event instead of counting two.
export function newEventId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    // fall through
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`;
}

function readCookie(name) {
  try {
    const hit = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
    return hit ? decodeURIComponent(hit.slice(name.length + 1)) : '';
  } catch {
    return '';
  }
}

// The pixel's own browser identifiers, which let Meta match a server event to the
// visitor. _fbp is set by fbevents.js; _fbc by an ad click, or rebuilt here from
// the fbclid in the landing URL when the cookie isn't there yet.
export function getMetaBrowserIds() {
  const fbp = readCookie('_fbp');
  let fbc = readCookie('_fbc');
  if (!fbc) {
    try {
      const fbclid = new URLSearchParams(window.location.search).get('fbclid');
      if (fbclid && /^[A-Za-z0-9_-]{1,500}$/.test(fbclid)) fbc = `fb.1.${Date.now()}.${fbclid}`;
    } catch {
      // no fbclid
    }
  }
  return { ...(fbp ? { fbp } : {}), ...(fbc ? { fbc } : {}) };
}

// Server copy of a browser event (meta-capi Edge Function -> Conversions API).
// Fire-and-forget: a failure must never reach the page.
function sendServerEvent(eventName, eventId, params) {
  try {
    supabase.functions
      .invoke('meta-capi', {
        body: {
          event_name: eventName,
          event_id: eventId,
          // Path only: the query string can carry tokens.
          event_source_url: `${window.location.origin}${window.location.pathname}`,
          ...getMetaBrowserIds(),
          ...params,
        },
      })
      .catch(() => {});
  } catch {
    // Tracking must never throw into the app.
  }
}

// Anything Meta has no standard event for.
export function pixelTrackCustom(event, params) {
  fbq('trackCustom', event, params || {});
}

// Checkout plan keys (create-paystack-checkout) -> list price. 'proupgrade' is
// absent on purpose: its price depends on what the buyer already owns.
const PLAN_PRICES = {
  builder1: BUILDER1_PRICE,
  builder2: BUILDER2_PRICE,
  pro: PRO_PRICE,
  vibecoding: VIBECODING_PRICE,
  aimastery: AI_AGENT_MASTERY_PRICE,
};

export function trackInitiateCheckout(plan) {
  const value = PLAN_PRICES[plan];
  pixelTrack('InitiateCheckout', {
    content_name: plan,
    content_ids: [plan],
    content_type: 'product',
    currency: CURRENCY,
    ...(value ? { value } : {}),
  });
}

// Product pages -> ViewContent. Path matching ignores a trailing slash.
const PRODUCT_PAGES = {
  '/pricing': { name: 'pricing' },
  '/ai-builder': { name: 'ai-builder' },
  '/builder-1-guide': { name: 'builder1', value: BUILDER1_PRICE },
  '/vibe-coding': { name: 'vibecoding', value: VIBECODING_PRICE },
  '/ai-agent-mastery': { name: 'aimastery', value: AI_AGENT_MASTERY_PRICE },
  '/scholarship': { name: 'aimastery-scholarship' },
};

function normalisePath(pathname) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

// Clicks are only tracked on the public site, never inside the student
// dashboard or admin panel.
function isPublicPath(pathname) {
  return !pathname.startsWith('/dashboard') && !pathname.startsWith('/admin');
}

function clickLabel(el) {
  const raw = el.getAttribute('data-pixel-label') || el.getAttribute('aria-label') || el.textContent || '';
  return raw.replace(/\s+/g, ' ').trim().slice(0, 60);
}

function describeClick(el, pathname) {
  const label = clickLabel(el);
  if (!label) return null;
  const href = el.tagName === 'A' ? el.getAttribute('href') : null;
  if (!href) return { label, page: pathname };
  try {
    const url = new URL(href, window.location.origin);
    if (url.protocol === 'mailto:' || url.protocol === 'tel:') {
      return { label, page: pathname, destination: url.protocol, external: true };
    }
    const external = url.origin !== window.location.origin;
    return {
      label,
      page: pathname,
      // Host only for outbound links, path only for internal ones. Never the
      // query string, which can carry tokens or personal data.
      destination: external ? url.hostname : url.pathname,
      external,
      whatsapp: /(^|\.)wa\.me$|(^|\.)whatsapp\.com$/.test(url.hostname),
    };
  } catch {
    return null;
  }
}

// One delegated listener for the whole app: every button and link click on the
// public site is reported as a ButtonClick custom event with its visible label
// and the page it was on, and WhatsApp links also fire the standard Contact
// event. A single listener means new buttons are covered without touching them;
// add data-pixel-label="..." to a button whose text isn't a good name.
function usePixelClickTracking() {
  useEffect(() => {
    const onClick = (e) => {
      const pathname = normalisePath(window.location.pathname);
      if (!isPublicPath(pathname)) return;
      const el = e.target instanceof Element ? e.target.closest('a[href], button, [role="button"]') : null;
      if (!el || el.disabled) return;
      const info = describeClick(el, pathname);
      if (!info) return;
      pixelTrackCustom('ButtonClick', {
        button_label: info.label,
        page: info.page,
        ...(info.destination ? { destination: info.destination } : {}),
        ...(info.external ? { outbound: true } : {}),
      });
      if (info.whatsapp) pixelTrack('Contact', { content_name: 'WhatsApp', page: info.page });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
}

function usePixelViewContent() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = PRODUCT_PAGES[normalisePath(pathname)];
    if (!page) return;
    // One id per page view, shared by the pixel event and its server copy so
    // Meta counts them once. event_name must match exactly on both sides.
    const eventId = newEventId();
    pixelTrack('ViewContent', {
      content_name: page.name,
      content_type: 'product',
      ...(page.value ? { value: page.value, currency: CURRENCY } : {}),
    }, eventId);
    sendServerEvent('ViewContent', eventId, {
      content_name: page.name,
      ...(page.value ? { value: page.value } : {}),
    });
  }, [pathname]);
}

// Paystack sends the buyer back to /dashboard?trxref=<ref>&reference=<ref>.
// That URL is also what a buyer who cancels or whose card fails can land on,
// so it is not proof of payment: the Purchase event is sent only once the
// payments row for that reference (readable by its owner under RLS, written
// only by paystack-webhook after it verifies the charge) is marked granted.
// The webhook can lag a few seconds behind the redirect, hence the polling.
// The reference doubles as Meta's eventID, and a localStorage list stops a
// reload from counting the sale twice.
const REFERENCE_RE = /^sdt_[a-z0-9]+_[0-9a-f-]{36}_\d{10,16}$/i;
const SENT_KEY = 'sdt_pixel_purchases';
const POLL_MS = 3000;
const POLL_TRIES = 15;

function readSent() {
  try {
    const list = JSON.parse(localStorage.getItem(SENT_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function rememberSent(ref) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify([...readSent(), ref].slice(-20)));
  } catch {
    // Private mode: Meta's eventID dedupe still covers a reload.
  }
}

// Sends the Purchase event for a verified payment ({ amount, currency, plan }
// from the payments row, or from guest-checkout-status for a guest), once per
// reference. Shared by the signed-in return to /dashboard (above) and the
// guest return to /checkout/complete.
export function trackPurchase(reference, payment) {
  if (readSent().includes(reference)) return;
  // The amount actually charged, as a number above zero. Anything else is not
  // sent at all: a Purchase with a missing, zero or default value is what Meta
  // reports as a placeholder price (pixel_placeholder_value_single_event_actions).
  const value = Number(payment.amount);
  if (!Number.isFinite(value) || value <= 0) return;
  pixelTrack('Purchase', {
    value: Math.round(value * 100) / 100,
    currency: payment.currency || CURRENCY,
    content_name: payment.plan || undefined,
    content_ids: payment.plan ? [payment.plan] : undefined,
    content_type: 'product',
  }, reference);
  rememberSent(reference);
  // The same verified payment closes the funnel on /admin/course-pages.
  trackCoursePaid(reference, payment.plan);
}

function usePixelPurchase(user) {
  const { pathname, search } = useLocation();
  const handled = useRef(new Set());
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !pathname.startsWith('/dashboard')) return undefined;
    const params = new URLSearchParams(search);
    const reference = params.get('reference') || params.get('trxref');
    if (!reference || !REFERENCE_RE.test(reference)) return undefined;
    const seen = handled.current;
    if (seen.has(reference) || readSent().includes(reference)) return undefined;
    seen.add(reference);

    let cancelled = false;
    let timer;
    let tries = 0;
    const check = async () => {
      if (cancelled) return;
      tries += 1;
      const { data } = await supabase
        .from('payments')
        .select('amount, currency, plan, status')
        .eq('provider_transaction_id', reference)
        .maybeSingle();
      if (cancelled) return;
      if (data && String(data.status).startsWith('granted')) {
        trackPurchase(reference, data);
        return;
      }
      if (tries < POLL_TRIES) timer = setTimeout(check, POLL_MS);
    };
    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      // Allow a retry if the effect re-ran before the purchase was recorded.
      if (!readSent().includes(reference)) seen.delete(reference);
    };
  }, [userId, pathname, search]);
}

// Mounted once in AppShell.
export function usePixelEvents(user) {
  usePixelClickTracking();
  usePixelViewContent();
  usePixelPurchase(user);
}
