import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// First-party page-view counter for /admin/analytics (supabase/admin-analytics.sql).
// The site posts one small beacon per page view. Public endpoint: deploy with
// verify_jwt = false. Stores the path, a coarse traffic source, device class and
// country, plus keyed hashes of the browser id and IP (the IP hash only
// rate-limits). No cookies, no raw identifiers, no query strings.
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

const MAX_PER_IP_PER_MINUTE = 120; // many Nigerian users share one carrier NAT
const MINUTE_MS = 60 * 1000;
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|uptime|curl|wget|python|axios|node-fetch|go-http|facebookexternalhit|whatsapp|telegram|discord/i;

// Reduces a referrer host / utm_source to a short, stable label for the sources list.
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
  // Anything else: keep the host / campaign name, letters and digits only.
  return s.replace(/[^a-z0-9._-]/g, '').slice(0, 60);
}

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
  // The beacon never reads the reply, so answer every outcome with a bare 204:
  // a probe learns nothing about why a request was dropped.
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

  // Path only, no query or hash.
  const path = String(body.path ?? '').split(/[?#]/)[0].trim();
  if (!path.startsWith('/') || path.length > 200 || /[\s<>"']/.test(path)) return done();
  if (path.startsWith('/admin')) return done();

  const vid = String(body.vid ?? '');
  const visitorHash = /^[A-Za-z0-9_-]{8,64}$/.test(vid) ? await keyedHash(`vid:${vid}`) : null;
  const isEntry = body.entry === true;
  const source = isEntry ? normalizeSource(String(body.src ?? '')) : '';
  const device = body.device === 'mobile' || body.device === 'tablet' ? body.device : 'desktop';
  const countryRaw = (req.headers.get('cf-ipcountry') ?? '').toUpperCase();
  const country = /^[A-Z]{2}$/.test(countryRaw) && countryRaw !== 'XX' && countryRaw !== 'T1' ? countryRaw : null;

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const clientIp = (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0] ??
    ''
  ).trim();
  const ipHash = await keyedHash(`ip:${clientIp}`);
  if (ipHash) {
    const { count } = await sb
      .from('site_visits')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', new Date(Date.now() - MINUTE_MS).toISOString());
    if ((count ?? 0) >= MAX_PER_IP_PER_MINUTE) return done();
  }

  const { error } = await sb.from('site_visits').insert({
    path,
    source: source || null,
    is_entry: isEntry,
    device,
    country,
    visitor_hash: visitorHash,
    ip_hash: ipHash,
  });
  if (error) console.error('visit insert failed:', error.code);
  return done();
});
