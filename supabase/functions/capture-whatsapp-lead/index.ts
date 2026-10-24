import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Registers a visitor who filled the floating WhatsApp button's pre-chat form as
// a checkout lead (supabase/lead-followups.sql), so /admin/leads shows everyone
// who reached out, not only people who went on to Paystack. Public endpoint:
// deploy with verify_jwt = false. Nothing is charged and no account is created;
// the row is source 'whatsapp_form'.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/socialdevtechnologies\.com$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
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

// The plan keys the form offers; anything else is dropped.
const PLAN_KEYS = ['aimastery', 'vibecoding', 'builder1', 'builder2', 'pro'];
const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
const MAX_PER_IP_PER_HOUR = 20; // many Nigerian users share one carrier NAT
const MAX_PER_HOUR = 400;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Keyed hash of the caller's IP, same scheme as create-paystack-checkout.
async function hashIp(ip: string) {
  if (!ip) return null;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SUPABASE_SERVICE_ROLE_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  // Honeypot: a real visitor never sees or fills this field. Answer success so a
  // bot learns nothing.
  if (typeof body.website === 'string' && body.website.trim() !== '') return json({ ok: true });

  const name = String(body.name ?? '').replace(/\s+/g, ' ').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const phone = String(body.phone ?? '').trim();
  const country = String(body.country ?? '').trim().toUpperCase();
  const plans = (Array.isArray(body.plans) ? body.plans : [])
    .map((p) => String(p))
    .filter((p, i, all) => PLAN_KEYS.includes(p) && all.indexOf(p) === i);

  if (name.length < 2 || name.length > 80 || /[<>]/.test(name)) return json({ error: 'Enter your full name.' }, 400);
  if (email && (email.length > 254 || !EMAIL_RE.test(email))) return json({ error: 'Enter a valid email address.' }, 400);
  if (!/^\+[1-9][0-9]{7,14}$/.test(phone)) return json({ error: 'Enter a valid phone number with its country code.' }, 400);

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const clientIp = (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0] ??
    ''
  ).trim();
  const ipHash = await hashIp(clientIp);
  const since = new Date(Date.now() - HOUR_MS).toISOString();
  if (ipHash) {
    const { count: fromIp } = await sb
      .from('checkout_leads')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since);
    if ((fromIp ?? 0) >= MAX_PER_IP_PER_HOUR) return json({ error: 'Too many attempts. Please wait a little.' }, 429);
  }
  const { count: lastHour } = await sb
    .from('checkout_leads')
    .select('id', { count: 'exact', head: true })
    .eq('source', 'whatsapp_form')
    .gte('created_at', since);
  if ((lastHour ?? 0) >= MAX_PER_HOUR) return json({ error: 'We are busy right now. Please try again shortly.' }, 429);

  // The same person pressing the button again within a day is one lead, not two.
  const { data: existing } = await sb
    .from('checkout_leads')
    .select('id')
    .eq('phone', phone)
    .eq('source', 'whatsapp_form')
    .gte('created_at', new Date(Date.now() - DAY_MS).toISOString())
    .limit(1);
  if (existing && existing.length > 0) return json({ ok: true });

  const { error } = await sb.from('checkout_leads').insert({
    name,
    email: email || null,
    phone,
    country_iso: /^[A-Z]{2}$/.test(country) ? country : null,
    plan: plans.length > 0 ? plans.join(',') : 'unspecified',
    source: 'whatsapp_form',
    ip_hash: ipHash,
  });
  if (error) {
    console.error('whatsapp lead insert failed:', error.code);
    return json({ error: 'Could not save your details.' }, 500);
  }
  return json({ ok: true });
});
