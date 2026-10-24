// First-party page-view counter behind /admin/analytics (supabase/admin-analytics.sql,
// supabase/functions/track-visit). One tiny beacon per page view: the path (no query
// string), a coarse source on the first page of a visit, and a random browser id kept
// in localStorage. The function stores only a keyed hash of that id.
//
// Counts the live site only. Local dev, Vercel previews, the prerender's headless
// Chrome and the admin area are skipped so they can't pollute the numbers.
const VID_KEY = 'sdt_vid';
const ENTRY_KEY = 'sdt_visit_started';
const LIVE_HOSTS = new Set(['socialdevtechnologies.com', 'www.socialdevtechnologies.com']);

let lastPath = null;

function visitorId() {
  try {
    let id = localStorage.getItem(VID_KEY);
    if (!id) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(VID_KEY, id);
    }
    return id;
  } catch {
    return ''; // storage blocked: still counted as a view, not as a unique visitor
  }
}

// True for the first page view of a browser session.
function isEntryView() {
  try {
    if (sessionStorage.getItem(ENTRY_KEY)) return false;
    sessionStorage.setItem(ENTRY_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

function deviceClass() {
  const ua = navigator.userAgent || '';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
}

// utm_source wins; then Facebook's click id; then the referring site's host.
function trafficSource() {
  const params = new URLSearchParams(window.location.search);
  const utm = params.get('utm_source');
  if (utm) return utm;
  if (params.get('fbclid')) return 'facebook';
  try {
    const host = new URL(document.referrer).hostname;
    return LIVE_HOSTS.has(host) ? '' : host;
  } catch {
    return '';
  }
}

export function trackVisit(pathname) {
  try {
    if (!LIVE_HOSTS.has(window.location.hostname)) return;
    if (navigator.webdriver || pathname.startsWith('/admin')) return;
    if (pathname === lastPath) return;
    lastPath = pathname;

    const entry = isEntryView();
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-visit`;
    // text/plain keeps this a "simple" request (no CORS preflight); the function
    // parses the body as JSON regardless. keepalive lets it finish during navigation.
    fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        path: pathname,
        vid: visitorId(),
        entry,
        src: entry ? trafficSource() : '',
        device: deviceClass(),
      }),
    }).catch(() => {});
  } catch {
    // analytics must never break the page
  }
}
