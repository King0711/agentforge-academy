import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Set PAYSTACK_SECRET_KEY in your Supabase Edge Function secrets — Paystack
// signs webhooks with your secret key directly (no separate webhook secret).
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Expected NGN prices — must match Pricing.jsx and create-paystack-checkout
// exactly. The ₦100,000 shown struck through on the Builder cards is a
// marketing anchor, never a real charge amount — never add it here.
const PRICES = {
  builder1: 50000,
  builder2: 50000,
  pro: 90000,
};
const AMOUNT_TOLERANCE = 1;

async function hmacSha512Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Builder 1 and Builder 2 cost the same (₦50,000), so amount alone can't
// tell them apart — trust the plan embedded in metadata at checkout
// creation (see create-paystack-checkout), but still verify its price
// matches before granting anything. Only fall back to amount-only
// resolution for payments with no metadata (e.g. a manual charge created
// directly in the Paystack dashboard), where 'pro' is the only plan an
// amount alone can identify unambiguously.
function resolvePlan(metadataPlan, amountNaira, currency) {
  if (currency !== 'NGN') return null;
  if (metadataPlan && PRICES[metadataPlan] !== undefined && Math.abs(amountNaira - PRICES[metadataPlan]) <= AMOUNT_TOLERANCE) {
    return metadataPlan;
  }
  if (Math.abs(amountNaira - PRICES.pro) <= AMOUNT_TOLERANCE) return 'pro';
  return null;
}

serve(async (req) => {
  const rawBody = await req.text();

  // Verify HMAC-SHA512 signature — proves this request genuinely came from
  // Paystack and that its payload (including metadata we set at checkout
  // creation) hasn't been tampered with.
  const signature = req.headers.get('x-paystack-signature') ?? '';
  const expected = await hmacSha512Hex(PAYSTACK_SECRET_KEY, rawBody);
  if (signature !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  if (payload.event !== 'charge.success' || payload.data?.status !== 'success') {
    return new Response('Ignored', { status: 200 });
  }

  const txId = String(payload.data?.reference ?? payload.data?.id ?? '');
  const amountNaira = Number(payload.data?.amount) / 100; // kobo -> naira
  const currency = String(payload.data?.currency ?? '');
  const email = payload.data?.customer?.email;
  const metadataUserId = payload.data?.metadata?.user_id;

  if (!txId) return new Response('Missing transaction reference', { status: 400 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Idempotency: a retried/duplicated webhook delivery must never double-process.
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('provider_transaction_id', txId)
    .maybeSingle();
  if (existing) return new Response('Already processed', { status: 200 });

  // Never trust event type or metadata alone — verify the amount matches a
  // real plan price before granting anything.
  const metadataPlan = payload.data?.metadata?.plan;
  const plan = resolvePlan(metadataPlan, amountNaira, currency);
  if (!plan) {
    await supabase.from('payments').insert({
      user_id: null,
      provider: 'paystack',
      provider_transaction_id: txId,
      amount: Number.isFinite(amountNaira) ? amountNaira : 0,
      currency: currency || 'unknown',
      status: 'flagged_unrecognized_amount',
    });
    return new Response('Amount did not match a known plan price', { status: 200 });
  }

  // Prefer the user id we embedded in metadata when creating the checkout
  // (see create-paystack-checkout) — exact and not spoofable, since the
  // whole payload is signature-verified above. Fall back to email lookup
  // only for payments that didn't originate from our own checkout flow
  // (e.g. a manual charge created directly in the Paystack dashboard).
  let userId = metadataUserId || null;
  if (!userId && email) {
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1);
    userId = users?.[0]?.id || null;
  }

  if (!userId) {
    await supabase.from('payments').insert({
      user_id: null,
      provider: 'paystack',
      provider_transaction_id: txId,
      amount: amountNaira,
      currency,
      status: 'flagged_no_matching_user',
    });
    return new Response('User not found', { status: 404 });
  }

  // Every plan is a one-time payment for 6 months of access (founder-confirmed).
  // Pro grants both tracks at once with no prerequisite; Builder 1/2 grant
  // only their own track.
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 182);
  const expiresAtIso = expiresAt.toISOString();

  const entitlementUpdate = { payment_provider: 'paystack' };
  if (plan === 'pro') {
    entitlementUpdate.builder1_expires_at = expiresAtIso;
    entitlementUpdate.builder2_expires_at = expiresAtIso;
  } else if (plan === 'builder1') {
    entitlementUpdate.builder1_expires_at = expiresAtIso;
  } else if (plan === 'builder2') {
    entitlementUpdate.builder2_expires_at = expiresAtIso;
  }

  await supabase
    .from('entitlements')
    .update(entitlementUpdate)
    .eq('user_id', userId);

  await supabase.from('payments').insert({
    user_id: userId,
    provider: 'paystack',
    provider_transaction_id: txId,
    amount: amountNaira,
    currency,
    plan,
    status: 'granted',
  });

  return new Response('OK', { status: 200 });
});
