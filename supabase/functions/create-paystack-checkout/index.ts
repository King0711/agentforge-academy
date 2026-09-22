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
// the amount check in paystack-webhook — this constant is what's actually
// sent to Paystack (see amountNaira below), so a mismatch with the
// webhook's own PRICES means a real charge gets flagged as unrecognized.
//
// Cut from 50000/50000/90000 to 25000/25000/45000 (2026-09-02). Pro kept
// at a ~10% discount off buying both tracks separately, same ratio as
// before, rather than left at 90000 (which would cost more than the two
// tracks bought individually).
//
// vibecoding (added 2026-09-08) is the separate live-cohort Vibe Coding
// bootcamp, not a tier of the builder1/builder2/pro ladder above — it's
// priced independently and happens to land at the same amount as
// builder1/builder2. That's fine: the webhook's resolvePlan() trusts the
// metadata.plan set below for exact identification, only falling back to
// amount-only matching (pro-only) for metadata-less payments.
const PRICES = {
  builder1: 25000,
  builder2: 25000,
  pro: 45000,
  vibecoding: 25000,
};

// A-la-carte guide purchases (2026-09-19) — a separate, additive path
// alongside the tiers above, not a replacement. Permanent access to
// one guide or a whole tier's guides, no 6-month expiry, no AI Builder
// credits, no cohort perks — priced and framed like buying a book.
// Keep these in sync with paystack-webhook's own copy of this object.
const GUIDE_PRICES = { builder1: 1999, builder2: 3999 };
const BUNDLE_PRICES = { builder1: 14000, builder2: 19999 };

// This function is called directly from the browser (Pricing.jsx via
// supabase.functions.invoke), so it needs CORS headers and to answer the
// browser's preflight OPTIONS request — without these, the browser blocks
// the request before it ever reaches this code and supabase-js reports
// "Failed to send a request to the Edge Function". Restricted to an
// allowlist rather than '*' since this endpoint performs a privileged,
// state-changing action (initiates a real charge) for an authenticated
// user — but still needs to allow local dev (localhost) and Vercel preview
// deployments (*.vercel.app), not just the production domain.
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

  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

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

  const { plan, redirectOrigin, courseId } = body;
  if (typeof plan !== 'string') {
    return jsonResponse({ error: 'Unknown plan' }, 400);
  }

  let amountNaira;
  let metadata = { user_id: user.id, plan };
  let referenceSuffix = plan;

  if (plan === 'guide') {
    // Individual guide purchase — price depends on which tier the
    // course_id belongs to, looked up from course_content itself
    // (never trust a client-supplied tier) rather than a hardcoded
    // id range, so this stays correct if courses are ever renumbered.
    const parsedCourseId = Number(courseId);
    if (!Number.isInteger(parsedCourseId)) {
      return jsonResponse({ error: 'courseId required for a guide purchase' }, 400);
    }
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: courseRow } = await service
      .from('course_content')
      .select('tier')
      .eq('course_id', parsedCourseId)
      .maybeSingle();
    if (!courseRow || !Object.hasOwn(GUIDE_PRICES, courseRow.tier)) {
      return jsonResponse({ error: 'Unknown or non-purchasable course_id' }, 400);
    }
    amountNaira = GUIDE_PRICES[courseRow.tier];
    metadata = { user_id: user.id, plan, course_id: parsedCourseId };
    referenceSuffix = `guide${parsedCourseId}`;
  } else if (Object.hasOwn(BUNDLE_PRICES, plan.replace('bundle_', '')) && plan.startsWith('bundle_')) {
    amountNaira = BUNDLE_PRICES[plan.replace('bundle_', '')];
  } else if (Object.hasOwn(PRICES, plan)) {
    amountNaira = PRICES[plan];
  } else {
    return jsonResponse({ error: 'Unknown plan' }, 400);
  }

  // Embed the verified user id + plan (+ course_id for a single guide) in
  // Paystack's metadata. Paystack signs the whole webhook payload with our
  // secret key, so when it comes back we can trust this exactly as much as
  // we trust our own signature check — this is what lets the webhook grant
  // access by user id instead of the fragile "match the payer's email"
  // approach.
  const reference = `sdt_${referenceSuffix}_${user.id}_${Date.now()}`;

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
      metadata,
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
