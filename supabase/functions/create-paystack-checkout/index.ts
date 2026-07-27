import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Set PAYSTACK_SECRET_KEY in your Supabase Edge Function secrets.
// SUPABASE_URL and SUPABASE_ANON_KEY are injected automatically.
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Prices in NGN (major units). Paystack settles in NGN even for
// international card holders — it handles FX conversion on its end, so
// there's no separate USD price. Keep these in sync with Pricing.jsx and
// the amount check in paystack-webhook.
const PRICES = {
  builder1: 50000,
  builder2: 50000,
  pro: 90000,
};

// This function is called directly from the browser (Pricing.jsx via
// supabase.functions.invoke), so it needs CORS headers and to answer the
// browser's preflight OPTIONS request — without these, the browser blocks
// the request before it ever reaches this code and supabase-js reports
// "Failed to send a request to the Edge Function".
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  // Identify the caller from their Supabase JWT (this function requires
  // verify_jwt: true) — never trust a client-supplied user id.
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { plan, redirectOrigin } = body;
  const amountNaira = PRICES[plan];
  if (!amountNaira) return jsonResponse({ error: 'Unknown plan' }, 400);

  // Embed the verified user id + plan in Paystack's metadata. Paystack
  // signs the whole webhook payload with our secret key, so when it comes
  // back we can trust this exactly as much as we trust our own signature
  // check — this is what lets the webhook grant access by user id instead
  // of the fragile "match the payer's email" approach.
  const reference = `sdt_${plan}_${user.id}_${Date.now()}`;

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: amountNaira * 100, // kobo
      currency: 'NGN',
      reference,
      metadata: { user_id: user.id, plan },
      callback_url: `${redirectOrigin || ''}/dashboard`,
    }),
  });

  const data = await paystackRes.json();
  if (!paystackRes.ok || !data.status) {
    return jsonResponse({ error: data.message || 'Failed to initialize payment' }, 502);
  }

  // Log the attempt so the abandoned-checkout reminder can find people who
  // started paying and never finished. Uses the service role client since
  // the caller's own JWT has no insert grant on checkout_attempts (by design
  // — only the service role and admin RPCs touch this table). Best-effort:
  // a logging failure here must never block the actual checkout redirect.
  try {
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    await serviceClient.from('checkout_attempts').insert({
      user_id: user.id,
      plan,
      provider_reference: reference,
    });
  } catch (_err) {
    // non-fatal — see comment above
  }

  return jsonResponse({ authorization_url: data.data.authorization_url });
});
