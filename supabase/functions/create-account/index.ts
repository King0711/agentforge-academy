import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Same allowlist pattern as the other public-facing functions (send-broadcast-email,
// create-paystack-checkout) — allows local dev and Vercel previews alongside prod.
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/socialdevtechnologies\.com$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];

function corsHeadersFor(req) {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://socialdevtechnologies.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const displayName = String(body.displayName || '').trim();

  if (!EMAIL_RE.test(email)) return jsonResponse({ error: 'Enter a valid email address.' }, 400);
  if (password.length < 6) return jsonResponse({ error: 'Password must be at least 6 characters.' }, 400);

  const isBYU = email.endsWith('@byupathway.edu');
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Supabase Auth's own signup-confirmation email currently can't be
  // delivered — the Resend account behind Auth's SMTP settings is sandboxed
  // to one verified address, so supabase.auth.signUp() was failing on the
  // "send confirmation email" step for every real signup (see CLAUDE.md,
  // "Sign-up email confirmation" incident). Creating the account via the
  // admin API with email_confirm:true skips that broken send path entirely
  // and activates the account immediately — trading email-address
  // verification for a working signup flow until Auth's SMTP is fixed
  // properly (domain verification at resend.com/domains).
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName || email.split('@')[0],
      is_byu_student: isBYU,
    },
  });

  if (error) {
    const status = error.status === 422 || /already registered/i.test(error.message) ? 409 : 400;
    return jsonResponse({ error: error.message }, status);
  }

  return jsonResponse({ ok: true, userId: data.user.id });
});
