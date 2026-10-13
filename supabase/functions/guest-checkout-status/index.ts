import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Public status check for a guest checkout (supabase/guest-checkout.sql).
//
// A guest pays without an account, so when Paystack sends them back to
// /checkout/complete they have no session and can't read their own payments
// row. That page asks this function whether the payment behind its `reference`
// has been granted yet (paystack-webhook writes the row, usually within a few
// seconds) and, if so, what it was — which is what the Meta Purchase event
// needs. The reference is a signed-checkout reference only the payer's browser
// was sent to; the answer is just plan, amount and currency (no name, email or
// phone), and only for a payment the webhook has already verified.
//
// Deploy with the default verify_jwt (true): the browser always sends the anon
// key, which is enough.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// sdt_<plan>_<uuid>_<timestamp>, as built by create-paystack-checkout.
const REFERENCE_RE = /^sdt_[a-z0-9]+_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_\d{10,16}$/i;

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
  const reference = String(body?.reference ?? '').trim();
  if (!REFERENCE_RE.test(reference)) return json({ error: 'Invalid reference' }, 400);

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await sb
    .from('payments')
    .select('status, plan, amount, currency')
    .eq('provider_transaction_id', reference)
    .maybeSingle();
  if (error) {
    console.error('guest status lookup failed:', error.code);
    return json({ error: 'Could not check the payment. Please try again.' }, 500);
  }

  // No row yet = the webhook hasn't processed it (or it was never paid).
  if (!data) return json({ status: 'pending' });
  if (!String(data.status).startsWith('granted')) return json({ status: 'flagged' });
  return json({
    status: 'granted',
    plan: data.plan ?? null,
    amount: Number(data.amount),
    currency: data.currency ?? 'NGN',
  });
});
