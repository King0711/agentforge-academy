import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Landing-page analytics for the two course pages (supabase/course-page-analytics.sql,
// shown at /admin/course-pages). The page posts small batches of events: a view, speed
// numbers, scroll depth, section reach and time, CTA views/clicks, checkout-form steps.
// Public endpoint: deploy with verify_jwt = false. Everything is checked against an
// allow-list (event names, short lowercase labels, bounded numbers), so nothing typed by
// a visitor is stored. Only a keyed hash of the browser id and of the IP is kept (the IP
// hash only rate-limits), never the raw values, cookies or query strings.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/socialdevtechnologies\.com$/,
  /^https:\/\/www\.socialdevtechnologies\.com$/,
];

function corsHeadersFor(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://socialdevtechnologies.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

const PAGES = new Set(['aimastery', 'vibecoding']);
const EVENTS = new Set([
  'view', 'perf', 'scroll', 'section', 'section_time', 'cta_view', 'cta_click',
  'form_open', 'form_start', 'field_done', 'form_submit', 'form_error', 'to_paystack', 'paid',
]);
const MAX_EVENTS_PER_BATCH = 40;
const MAX_ROWS_PER_IP_PER_MINUTE = 400; // many Nigerian users share one carrier NAT
const MINUTE_MS = 60 * 1000;
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|uptime|curl|wget|python|axios|node-fetch|go-http|facebookexternalhit|whatsapp|telegram|discord/i;

// Same channel reduction as track-visit, so both dashboards name sources the same way.
function normalizeSource(raw: string): string {
  const s = raw.toLowerCase().trim().replace(/^www\./, '').slice(0, 60);
  if (!s) return '';
  if (/(^|\.)(facebook|fb)\.com$|^l\.facebook|^lm\.facebook|^m\.facebook|^fb$/.test(s) || s === 'facebook') return 'facebook';
  if (/instagram/.test(s) || s === 'ig') return 'instagram';
  if (/(^|\.)(t\.co|twitter\.com|x\.com)$/.test(s) || s === 'twitter' || s === 'x') return 'x';
  if (/(^|\.)google\./.test(s) || s === 'google') return 'google';
  if (/bing\./.test(s)) return 'bing';
  if (/(^|\.)(wa\.me|whatsapp\.com)$/.test(s) || s === 'whatsapp') return 'whatsapp';
  if (/linkedin|lnkd\.in/.test(s)) return 'linkedin';
  if (/youtube|youtu\.be/.test(s)) return 'youtube';
  if (/tiktok/.test(s)) return 'tiktok';
  if (/telegram|t\.me/.test(s)) return 'telegram';
  return s.replace(/[^a-z0-9._-]/g, '').slice(0, 60);
}

// Must stay the same key and prefix as track-visit, so a browser hashes to the same
// value in both tables.
async function keyedHash(value: string) {
  if (!value) return null;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SUPABASE_SERVICE_ROLE_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  // The beacon never reads the reply: answer every outcome with a bare 204 so a probe
  // learns nothing about why a request was dropped.
  const done = () => new Response(null, { status: 204, headers: corsHeaders });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  const ua = req.headers.get('user-agent') ?? '';
  if (!ua || BOT_RE.test(ua)) return done();

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return done();
  }

  const page = String(body.page ?? '');
  const viewId = String(body.view ?? '');
  if (!PAGES.has(page) || !/^[a-f0-9]{16,32}$/.test(viewId)) return done();
  if (!Array.isArray(body.events) || body.events.length === 0) return done();

  const vid = String(body.vid ?? '');
  const visitorHash = /^[A-Za-z0-9_-]{8,64}$/.test(vid) ? await keyedHash(`vid:${vid}`) : null;
  const device = body.device === 'mobile' || body.device === 'tablet' ? body.device : 'desktop';

  const rows = [];
  for (const raw of (body.events as unknown[]).slice(0, MAX_EVENTS_PER_BATCH)) {
    if (!raw || typeof raw !== 'object') continue;
    const ev = raw as Record<string, unknown>;
    const event = String(ev.e ?? '');
    if (!EVENTS.has(event)) continue;

    const labelRaw = ev.l == null ? '' : String(ev.l);
    const label = /^[a-z0-9_]{1,40}$/.test(labelRaw) ? labelRaw : null;
    const num = Number(ev.v);
    const value = ev.v != null && Number.isFinite(num) && num >= 0 && num <= 86400000 ? Math.round(num * 100) / 100 : null;

    // Every row carries every column: a batch with differing keys is padded with NULLs
    // by the client, which would break the NOT NULL is_entry column for the whole insert.
    const row: Record<string, unknown> = {
      page,
      view_id: viewId,
      visitor_hash: visitorHash,
      event,
      label,
      value,
      device,
      is_entry: false,
      source: null,
      campaign: null,
      ref_hash: null,
    };
    if (event === 'view') {
      row.is_entry = ev.entry === true;
      row.source = normalizeSource(String(ev.src ?? '')) || null;
      const campaign = String(ev.camp ?? '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 60);
      row.campaign = campaign || null;
    }
    if (event === 'paid') {
      const ref = String(ev.ref ?? '');
      if (!/^[a-f0-9]{64}$/.test(ref)) continue;
      row.ref_hash = ref;
    }
    rows.push(row);
  }
  if (rows.length === 0) return done();

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const clientIp = (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0] ??
    ''
  ).trim();
  const ipHash = await keyedHash(`ip:${clientIp}`);
  if (ipHash) {
    const { count } = await sb
      .from('page_events')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', new Date(Date.now() - MINUTE_MS).toISOString());
    if ((count ?? 0) >= MAX_ROWS_PER_IP_PER_MINUTE) return done();
  }
  for (const r of rows) r.ip_hash = ipHash;

  const { error } = await sb.from('page_events').insert(rows);
  if (error) console.error('page_events insert failed:', error.code);
  return done();
});
