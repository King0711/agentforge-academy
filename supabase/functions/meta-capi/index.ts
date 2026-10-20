import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import {
  SITE_ORIGIN, cleanFbc, cleanFbp, isTestMode, purchaseValue, requestClient, sendCapiEvent,
} from '../_shared/metaCapi.ts';

// Server-side twin of the browser pixel's ViewContent (src/lib/pixel.js).
//
// The browser fires fbq('track', 'ViewContent', ..., { eventID }) and, with the
// same id, posts it here; we forward it to Meta's Conversions API. Meta merges
// the pair by event_name + event_id, and the server copy still counts when an ad
// blocker or a slow connection stops the pixel, which is the coverage gap Events
// Manager reports (s2s_low_event_coverage_actions).
//
// Only ViewContent is accepted. Purchase is sent by paystack-webhook from the
// verified payment, never from the browser, so nobody can forge a sale here.
//
// Deploy with the default verify_jwt (true): supabase-js always sends the anon
// key, which is enough, and it keeps casual scripts out.

const EVENT_ID_RE = /^[A-Za-z0-9_-]{16,64}$/;
// Mirrors PRODUCT_PAGES in src/lib/pixel.js. Names only, never prices: a value
// that is out of range is dropped rather than trusted.
const CONTENT_NAMES = new Set([
  'pricing', 'ai-builder', 'builder1', 'vibecoding', 'aimastery', 'aimastery-scholarship',
]);
const MAX_VALUE = 1_000_000;
const CURRENCY = 'NGN';

// Events from previews and localhost would pollute the production dataset, so
// they are only forwarded while a Test Events code is set.
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/socialdevtechnologies\.com$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];

function corsHeadersFor(req) {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : SITE_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

// Best-effort flood guard per instance. A real visitor sends one event per page
// view, so this only trims scripts; the worst a forged ViewContent can do is
// add noise to a metric.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now - v[v.length - 1] >= WINDOW_MS) hits.delete(k);
  }
  return recent.length > MAX_PER_WINDOW;
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const eventName = String(body?.event_name ?? '');
  const eventId = String(body?.event_id ?? '');
  if (eventName !== 'ViewContent') return json({ error: 'Unsupported event' }, 400);
  if (!EVENT_ID_RE.test(eventId)) return json({ error: 'Invalid event_id' }, 400);

  const contentName = String(body?.content_name ?? '');
  if (!CONTENT_NAMES.has(contentName)) return json({ error: 'Unknown content' }, 400);

  // The page the visitor was on. Only our own origin is accepted, and only the
  // path is kept (no query string, which can carry tokens).
  const origin = req.headers.get('Origin') ?? '';
  const isProduction = origin === SITE_ORIGIN;
  if (!isProduction && !isTestMode()) return json({ ok: true, forwarded: false });
  let sourceUrl = SITE_ORIGIN + '/';
  try {
    const parsed = new URL(String(body?.event_source_url ?? ''));
    if (parsed.origin === origin) sourceUrl = SITE_ORIGIN + parsed.pathname;
  } catch {
    // keep the default
  }

  const client = requestClient(req);
  if (rateLimited(client.ip ?? 'unknown')) return json({ error: 'Too many requests' }, 429);

  // Same optional price the browser event carried (list price of the product).
  const value = body?.value == null ? null : purchaseValue(body.value);
  const customData: Record<string, unknown> = {
    content_name: contentName,
    content_type: 'product',
    ...(value && value <= MAX_VALUE ? { value, currency: CURRENCY } : {}),
  };

  const forwarded = await sendCapiEvent({
    eventName,
    eventId,
    eventSourceUrl: sourceUrl,
    userData: {
      clientIp: client.ip,
      clientUserAgent: client.userAgent,
      fbp: cleanFbp(body?.fbp),
      fbc: cleanFbc(body?.fbc),
    },
    customData,
  });

  // The browser never needs to know whether Meta accepted it.
  return json({ ok: true, forwarded });
});
