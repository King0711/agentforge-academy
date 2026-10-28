// Landing-page analytics for the two course pages, /ai-agent-mastery and
// /vibe-coding (supabase/course-page-analytics.sql, supabase/functions/track-page-events,
// shown at /admin/course-pages). Per page view it records: speed numbers, scroll
// depth, which sections were reached and for how long, which calls to action were
// seen and clicked, and how far people got in the checkout form - never what they
// typed. Events are batched and posted to the public track-page-events function;
// the browser id is the same random localStorage id src/lib/visits.js uses.
//
// Markup opts in with attributes, so a new section or button is covered by adding one:
//   data-track-section="pricing"   a section of the page (lowercase letters, digits, _)
//   data-track-cta="hero_primary"  a button or link
// The checkout button uses data-track-cta="pay"; the admin funnel counts that one as
// "clicked pay".
//
// Counts the live site only (same rule as visits.js), and the pages turn it on only
// for visitors who are not admins and not already enrolled in that course.
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { deviceClass, isCountedEnvironment, trafficSource, visitorId } from './visits';

const FLUSH_MS = 4000;
const BATCH_MAX = 40; // the function ignores anything past this per request
const SCROLL_STEPS = [10, 25, 50, 75, 90, 100];
const COURSE_PAGES = new Set(['aimastery', 'vibecoding']);
// Sent immediately instead of waiting for the next flush: the next thing that
// happens to these is usually a navigation away to Paystack.
const URGENT = new Set(['cta_click', 'form_open', 'form_submit', 'form_error', 'to_paystack']);

// The tracker for the course page on screen, if any. Other code (the checkout form,
// the checkout hook) reports through trackCourseEvent and no-ops when this is null.
let active = null;

function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function post(page, viewId, events) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-page-events`;
  for (let i = 0; i < events.length; i += BATCH_MAX) {
    // text/plain keeps this a "simple" request (no CORS preflight); the function
    // parses the body as JSON regardless. keepalive lets it finish during navigation.
    fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        page,
        view: viewId,
        vid: visitorId(),
        device: deviceClass(),
        events: events.slice(i, i + BATCH_MAX),
      }),
    }).catch(() => {});
  }
}

function flush(t) {
  clearTimeout(t.timer);
  t.timer = null;
  if (t.queue.length === 0) return;
  const events = t.queue;
  t.queue = [];
  post(t.page, t.viewId, events);
}

function enqueue(t, event, label, value, extra) {
  t.queue.push({ e: event, ...(label != null ? { l: label } : {}), ...(value != null ? { v: value } : {}), ...extra });
  if (URGENT.has(event)) flush(t);
  else if (!t.timer) t.timer = setTimeout(() => flush(t), FLUSH_MS);
}

// Report one event for the course page on screen. `once` keeps repeats (a field
// blurred twice, the same scroll depth reached again) from being sent twice.
export function trackCourseEvent(event, label = null, value = null, { once = false } = {}) {
  try {
    const t = active;
    if (!t) return;
    if (once) {
      const key = `${event}:${label ?? ''}`;
      if (t.seen.has(key)) return;
      t.seen.add(key);
    }
    enqueue(t, event, label, value);
  } catch {
    // analytics must never break the page
  }
}

function startTracking(page, entry) {
  if (!isCountedEnvironment() || active) return () => {};

  const t = { page, viewId: newId(), queue: [], timer: null, seen: new Set(), sections: new Map(), lcp: null };
  active = t;
  const cleanups = [];
  const nowMs = () => performance.now();

  const params = new URLSearchParams(window.location.search);
  enqueue(t, 'view', null, null, {
    entry,
    // Only a page opened directly has a meaningful referrer / utm; after in-site
    // navigation the address bar no longer carries them.
    src: entry ? trafficSource() : '',
    camp: entry ? params.get('utm_campaign') || '' : '',
  });

  // --- speed (page opened directly only: navigation timing describes that load) ---
  if (entry) {
    const sendLoad = () => {
      const nav = performance.getEntriesByType?.('navigation')?.[0];
      if (!nav) return;
      if (nav.responseStart > 0) enqueue(t, 'perf', 'ttfb', Math.round(nav.responseStart));
      if (nav.loadEventEnd > 0) enqueue(t, 'perf', 'load', Math.round(nav.loadEventEnd));
    };
    if (document.readyState === 'complete') {
      const id = setTimeout(sendLoad, 0);
      cleanups.push(() => clearTimeout(id));
    } else {
      const onLoad = () => setTimeout(sendLoad, 0);
      window.addEventListener('load', onLoad, { once: true });
      cleanups.push(() => window.removeEventListener('load', onLoad));
    }
    try {
      const po = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) t.lcp = e.renderTime || e.loadTime || e.startTime;
      });
      po.observe({ type: 'largest-contentful-paint', buffered: true });
      cleanups.push(() => po.disconnect());
    } catch {
      // not supported: no LCP for this browser
    }
  }

  // --- scroll depth ---
  let ticking = false;
  const checkScroll = () => {
    ticking = false;
    const doc = document.documentElement;
    if (!doc.scrollHeight) return;
    const depth = (((window.scrollY || doc.scrollTop) + window.innerHeight) / doc.scrollHeight) * 100;
    for (const step of SCROLL_STEPS) {
      if (depth >= step - 1) trackCourseEvent('scroll', String(step), null, { once: true });
    }
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(checkScroll);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  cleanups.push(() => window.removeEventListener('scroll', onScroll));
  checkScroll();

  // --- sections: reached, and time on screen (only while the tab is visible) ---
  const closeSection = (s, at) => {
    if (s.since != null) s.total += at - s.since;
    s.since = null;
  };
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const at = nowMs();
        for (const en of entries) {
          const name = en.target.getAttribute('data-track-section');
          if (!name) continue;
          let s = t.sections.get(name);
          if (!s) {
            s = { inView: false, since: null, total: 0 };
            t.sections.set(name, s);
          }
          if (en.isIntersecting) {
            s.inView = true;
            if (!document.hidden) s.since = at;
            trackCourseEvent('section', name, null, { once: true });
          } else {
            closeSection(s, at);
            s.inView = false;
          }
        }
      },
      // A section counts as reached once it is in the upper three quarters of the screen.
      { rootMargin: '0px 0px -25% 0px', threshold: 0 },
    );
    document.querySelectorAll('[data-track-section]').forEach((el) => sectionObserver.observe(el));
    cleanups.push(() => sectionObserver.disconnect());

    const ctaObserver = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) trackCourseEvent('cta_view', en.target.getAttribute('data-track-cta'), null, { once: true });
        }
      },
      { threshold: 0.5 },
    );
    document.querySelectorAll('[data-track-cta]').forEach((el) => ctaObserver.observe(el));
    cleanups.push(() => ctaObserver.disconnect());
  }

  // --- CTA clicks (a click also counts as a view, for buttons that mount late) ---
  const onClick = (e) => {
    const el = e.target instanceof Element ? e.target.closest('[data-track-cta]') : null;
    if (!el) return;
    const label = el.getAttribute('data-track-cta');
    trackCourseEvent('cta_view', label, null, { once: true });
    trackCourseEvent('cta_click', label);
  };
  document.addEventListener('click', onClick, true);
  cleanups.push(() => document.removeEventListener('click', onClick, true));

  // Closes the open section timers and sends what has built up.
  const report = ({ final }) => {
    const at = nowMs();
    for (const [name, s] of t.sections) {
      closeSection(s, at);
      if (s.total >= 100) enqueue(t, 'section_time', name, Math.round(s.total));
      s.total = 0;
    }
    if (t.lcp != null && !t.lcpSent && (final || document.hidden)) {
      enqueue(t, 'perf', 'lcp', Math.round(t.lcp));
      t.lcpSent = true;
    }
    flush(t);
  };
  const onVisibility = () => {
    if (document.hidden) {
      report({ final: false });
    } else {
      const at = nowMs();
      for (const s of t.sections.values()) if (s.inView) s.since = at;
    }
  };
  const onPageHide = () => report({ final: true });
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);
  cleanups.push(() => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
  });

  t.timer = setTimeout(() => flush(t), FLUSH_MS);

  return () => {
    if (active !== t) return;
    report({ final: true });
    cleanups.forEach((fn) => fn());
    clearTimeout(t.timer);
    active = null;
  };
}

// Turn tracking on for a course page while it is mounted. `enabled` should be false
// until it is known the visitor is neither an admin nor already enrolled.
export function useCoursePageTracking(page, enabled) {
  const location = useLocation();
  // Decided once per mount: react-router gives the first location of a session the
  // key "default", and a later #anchor jump must not turn this into a fresh entry.
  const [entry] = useState(() => location.key === 'default');
  useEffect(() => {
    if (!enabled || !COURSE_PAGES.has(page)) return undefined;
    return startTracking(page, entry);
  }, [page, enabled, entry]);
}

// A verified purchase (called from trackPurchase in pixel.js, which has already
// confirmed the payment is granted). Sends a hash of the Paystack reference, never
// the reference itself; the database only counts it when the hash matches a granted
// payment for this course and the same browser viewed the course page earlier.
export async function trackCoursePaid(reference, plan) {
  try {
    if (!COURSE_PAGES.has(plan) || !isCountedEnvironment() || !visitorId()) return;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(reference));
    const ref = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
    post(plan, newId(), [{ e: 'paid', ref }]);
  } catch {
    // analytics must never break the page
  }
}
