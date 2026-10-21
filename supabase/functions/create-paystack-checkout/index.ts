import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cleanFbc, cleanFbp, requestClient } from '../_shared/metaCapi.ts';

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
// builder1/builder2/pro cut from 25000/25000/45000 to 5000/7000/10000
// (2026-09-22) as part of repositioning them from a 6-month subscription
// (live cohort + AI Builder credits) into permanent, guides-only access —
// see supabase/guide-purchases-setup.sql. Builder 1 and Builder 2 no
// longer share one price: Builder 2 is priced above Builder 1 as the more
// advanced track. Pro (10000) is a discount off buying both separately
// (12000), same "just get Pro" logic as before at the new price floor.
//
// vibecoding and aimastery are both separate live-cohort products, not
// tiers of the builder1/builder2/pro ladder above — priced independently
// of each other and of the ladder (aimastery cut from 25000 to 19999 and
// vibecoding raised from 25000 to 50000, both 2026-09-23). The webhook's
// resolvePlan() trusts the metadata.plan set below for exact
// identification, only falling back to amount-only matching (pro-only)
// for metadata-less payments.
//
// (An 'agentslive' 2-day workshop plan with seat-based pricing existed from
// 2026-09-27 to 2026-09-29 and was removed with its page.)
const PRICES = {
  builder1: 5000,
  builder2: 7000,
  pro: 10000,
  vibecoding: 50000,
  aimastery: 19999,
};

// Pro upgrade-by-difference (2026-10-04): someone who already owns ONE
// permanent guide tier pays Pro minus what that tier cost, and gets the other
// tier. Keyed by the tier they already own. Derived from PRICES so it can't
// drift from them; paystack-webhook derives the same table and re-checks it.
const UPGRADE_PRICES = {
  builder1: PRICES.pro - PRICES.builder1, // owns Builder 1 -> unlocks Builder 2
  builder2: PRICES.pro - PRICES.builder2, // owns Builder 2 -> unlocks Builder 1
};

// aimastery scholarship price for people who have an approved application (2026-10-05, supabase/scholarship-applications.sql;
// the /scholarship form approves automatically by default). Two Supabase secrets
// with these defaults — paystack-webhook reads SCHOLARSHIP_PRICE_NAIRA too, so
// whatever is charged here is an amount it recognises:
//   SCHOLARSHIP_PRICE_NAIRA   default 10000
//   SCHOLARSHIP_EXPIRES_AT    default Fri 9 Oct 2026, 7:00 PM WAT (class start)
function parseEnvNumber(value, fallback) {
  const n = Number(String(value ?? '').trim());
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
function parseEnvTime(value, fallback) {
  const t = Date.parse(String(value ?? '').trim());
  return Number.isFinite(t) ? t : Date.parse(fallback);
}
const SCHOLARSHIP_PRICE_NAIRA = parseEnvNumber(Deno.env.get('SCHOLARSHIP_PRICE_NAIRA'), 10000);
const SCHOLARSHIP_EXPIRES_AT = parseEnvTime(Deno.env.get('SCHOLARSHIP_EXPIRES_AT'), '2026-10-09T19:00:00+01:00');

// The id of this email's approved, not-yet-redeemed scholarship application, or
// null. Never throws: if the lookup fails (e.g. the table isn't there yet) the
// caller simply pays the normal price rather than being blocked from checkout.
async function findApprovedScholarshipId(sb, email) {
  const { data, error } = await sb
    .from('scholarship_applications')
    .select('id')
    .eq('email', String(email ?? '').trim().toLowerCase())
    .eq('status', 'approved')
    .is('redeemed_at', null)
    .maybeSingle();
  if (error) {
    console.error('scholarship lookup failed:', error.code);
    return null;
  }
  return data?.id ?? null;
}

// Discount codes (2026-10-16, supabase/discount-codes.sql): an admin-generated
// code takes AI Agent Mastery down to this price. paystack-webhook has the same
// constant and accepts it as an aimastery amount — keep them together.
const DISCOUNT_CODE_PRICE_NAIRA = 10000;

// Looks a typed code up and says whether it can be used right now. The messages
// are written for the buyer. Never throws: a failed lookup is reported as an
// error rather than silently charging the wrong price.
async function lookupDiscountCode(sb, rawCode, plan) {
  const key = String(rawCode ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (key.length !== 10) return { error: "That code isn't valid. Check it and try again." };
  const code = `${key.slice(0, 5)}-${key.slice(5)}`;
  const { data, error } = await sb
    .from('discount_codes')
    .select('id, plan, max_uses, used_count, expires_at, disabled')
    .eq('code', code)
    .maybeSingle();
  if (error) {
    console.error('discount code lookup failed:', error.code);
    return { error: 'We could not check that code right now. Please try again.' };
  }
  if (!data || data.disabled || data.plan !== plan) return { error: "That code isn't valid. Check it and try again." };
  if (data.expires_at && Date.parse(data.expires_at) <= Date.now()) return { error: 'That code has expired.' };
  if (data.used_count >= data.max_uses) return { error: 'That code has already been used.' };
  return { coupon: { id: data.id, code } };
}

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

// ---- Guest checkout (2026-10-13, supabase/guest-checkout.sql) ----
// A signed-out visitor sends { lead: { name, email, phone, country } } instead of
// a JWT. We store it as a checkout_leads row (so abandoned buyers stay on the
// list) and charge with metadata.lead_id; paystack-webhook creates or finds the
// account only after a verified payment, and the email is verified at the
// buyer's first login. Guests can only buy the plain plans: no Pro upgrade
// (needs their purchase history) and no scholarship price (needs a confirmed
// email) — both stay signed-in-only.
const MAX_LEADS_PER_IP_PER_HOUR = 20; // many Nigerian users share one carrier NAT
const MAX_LEADS_PER_HOUR = 400;
const HOUR_MS = 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;

function validateLead(raw) {
  const lead = raw && typeof raw === 'object' ? raw : {};
  // Honeypot: a real visitor never sees or fills this field.
  if (typeof lead.website === 'string' && lead.website.trim() !== '') return { error: 'Invalid details.' };
  const name = String(lead.name ?? '').replace(/\s+/g, ' ').trim();
  const email = String(lead.email ?? '').trim().toLowerCase();
  const phone = String(lead.phone ?? '').trim();
  const country = String(lead.country ?? '').trim().toUpperCase();
  const referral = String(lead.referral_code ?? '').trim().toUpperCase();
  if (name.length < 2 || name.length > 80 || /[<>]/.test(name)) return { error: 'Enter your full name.' };
  if (email.length > 254 || !EMAIL_RE.test(email)) return { error: 'Enter a valid email address.' };
  if (!/^\+[1-9][0-9]{7,14}$/.test(phone)) return { error: 'Enter a valid phone number with its country code.' };
  return {
    value: {
      name,
      email,
      phone,
      country_iso: /^[A-Z]{2}$/.test(country) ? country : null,
      // Not a security boundary: handle_new_user validates it against real codes.
      referral_code: /^[A-Z0-9]{4,20}$/.test(referral) ? referral : null,
    },
  };
}

// Keyed hash of the caller's IP — counts submissions per source without keeping
// the address. The service-role key is the secret, so no new env var.
async function hashIp(ip) {
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
  // verify_jwt: true) — never trust a client-supplied user id. A visitor who
  // isn't signed in carries only the anon key, so getUser() finds no user and
  // the request is treated as a guest checkout (below) if it carries a lead.
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await supabase.auth.getUser();

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { plan, redirectOrigin } = body;
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // The price card's "Apply" button: says whether a typed code works, without
  // starting a checkout. Answers 200 either way so a wrong code isn't logged as
  // a failed request. Needs no sign-in (guests use codes too); codes are random
  // 50-bit strings, so guessing one is not practical.
  if (body.action === 'validate_coupon') {
    if (plan !== 'aimastery') return jsonResponse({ valid: false, error: 'Discount codes only apply to AI Agent Mastery.' });
    const found = await lookupDiscountCode(serviceClient, body.coupon, plan);
    if (found.error) return jsonResponse({ valid: false, error: found.error });
    return jsonResponse({ valid: true, code: found.coupon.code, price: Math.min(PRICES[plan], DISCOUNT_CODE_PRICE_NAIRA) });
  }

  if (!user && !body.lead) return jsonResponse({ error: 'Unauthorized' }, 401);
  if (typeof plan !== 'string' || (plan !== 'proupgrade' && !Object.hasOwn(PRICES, plan))) {
    return jsonResponse({ error: 'Unknown plan' }, 400);
  }
  if (!user && plan === 'proupgrade') {
    return jsonResponse({ error: 'Please log in to upgrade — the upgrade price depends on what you already own.' }, 401);
  }

  // A discount code is checked before anything is stored or charged, so a bad one
  // stops the checkout instead of silently charging the full price.
  let coupon; // { id, code }
  if (typeof body.coupon === 'string' && body.coupon.trim() !== '') {
    if (plan !== 'aimastery') return jsonResponse({ error: 'Discount codes only apply to AI Agent Mastery.' }, 400);
    const found = await lookupDiscountCode(serviceClient, body.coupon, plan);
    if (found.error) return jsonResponse({ error: found.error }, 400);
    coupon = found.coupon;
  }

  // Guest: validate, rate-limit, and store the lead before anything is charged.
  let lead; // { id, email } for a guest checkout
  if (!user) {
    const checked = validateLead(body.lead);
    if (checked.error) return jsonResponse({ error: checked.error }, 400);

    // cf-connecting-ip is set by the edge proxy and can't be forged by the caller.
    const clientIp = (
      req.headers.get('cf-connecting-ip') ??
      req.headers.get('x-forwarded-for')?.split(',')[0] ??
      ''
    ).trim();
    const ipHash = await hashIp(clientIp);
    const since = new Date(Date.now() - HOUR_MS).toISOString();
    if (ipHash) {
      const { count: fromIp } = await serviceClient
        .from('checkout_leads')
        .select('id', { count: 'exact', head: true })
        .eq('ip_hash', ipHash)
        .gte('created_at', since);
      if ((fromIp ?? 0) >= MAX_LEADS_PER_IP_PER_HOUR) {
        return jsonResponse({ error: 'Too many attempts. Please wait a little and try again.' }, 429);
      }
    }
    const { count: lastHour } = await serviceClient
      .from('checkout_leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since);
    if ((lastHour ?? 0) >= MAX_LEADS_PER_HOUR) {
      return jsonResponse({ error: 'We are busy right now. Please try again in a few minutes.' }, 429);
    }

    const { data: inserted, error: leadError } = await serviceClient
      .from('checkout_leads')
      .insert({ ...checked.value, plan, ip_hash: ipHash })
      .select('id, email')
      .single();
    if (leadError || !inserted) {
      console.error('checkout lead insert failed:', leadError?.code);
      return jsonResponse({ error: 'Could not start checkout. Please try again.' }, 500);
    }
    lead = inserted;
  }

  let amountNaira = PRICES[plan];

  // A signed-in buyer's referral link code (guests carry theirs on the lead).
  // Only a shape check here; paystack-webhook asks the database to attribute it
  // after the payment is verified, so an unknown code is simply ignored.
  const signedInReferral = String(body.referral_code ?? '').trim().toUpperCase();
  const referralCode = user && /^[A-Z0-9]{4,20}$/.test(signedInReferral) ? signedInReferral : undefined;

  // Scholarship price: the JWT-verified, email-CONFIRMED user, never anything
  // the client sends. The application must be
  // approved and unredeemed and the offer unexpired; webhook redemption makes it
  // single-use. Math.min keeps a misconfigured price from ever exceeding the
  // normal one.
  // A discount code takes precedence: it sets its own price and the person's
  // scholarship stays unredeemed for later.
  let scholarshipId;
  if (coupon) {
    amountNaira = Math.min(amountNaira, DISCOUNT_CODE_PRICE_NAIRA);
  } else if (
    plan === 'aimastery' && !!user?.email_confirmed_at &&
    Date.now() < SCHOLARSHIP_EXPIRES_AT
  ) {
    scholarshipId = (await findApprovedScholarshipId(serviceClient, user.email)) ?? undefined;
    if (scholarshipId) amountNaira = Math.min(amountNaira, SCHOLARSHIP_PRICE_NAIRA);
  }

  // The upgrade price is decided here from the caller's own permanent guide
  // purchases (the same rows usePro.js / the webhook read) — never from
  // anything the client sends. Exactly one tier owned = eligible; none or both
  // = nothing sensible to sell, so refuse rather than guess.
  let upgradeFrom;
  if (plan === 'proupgrade') {
    const { data: owned, error: ownedError } = await serviceClient
      .from('guide_purchases')
      .select('tier')
      .eq('user_id', user.id);
    if (ownedError) return jsonResponse({ error: 'Could not check your purchases. Please try again.' }, 500);
    const tiers = new Set((owned ?? []).map((r) => r.tier));
    if (tiers.has('builder1') && tiers.has('builder2')) {
      return jsonResponse({ error: 'You already own every guide.' }, 409);
    }
    if (!tiers.has('builder1') && !tiers.has('builder2')) {
      return jsonResponse({ error: 'The Pro upgrade is for people who already own Builder 1 or Builder 2.' }, 403);
    }
    upgradeFrom = tiers.has('builder1') ? 'builder1' : 'builder2';
    amountNaira = UPGRADE_PRICES[upgradeFrom];
  }

  // Embed the verified user id + plan in Paystack's metadata. Paystack
  // signs the whole webhook payload with our secret key, so when it comes
  // back we can trust this exactly as much as we trust our own signature
  // check — this is what lets the webhook grant access by user id instead
  // of the fragile "match the payer's email" approach.
  // For a guest the id in the reference is the lead's, not a user's (there is no
  // account yet); the webhook resolves it through metadata.lead_id.
  const reference = `sdt_${plan}_${user?.id ?? lead.id}_${Date.now()}`;

  // Where Paystack sends the browser afterwards. The client supplies it, so
  // restrict it to our own sites (same list as CORS) rather than trusting it.
  const callbackOrigin = ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(String(redirectOrigin ?? '')))
    ? redirectOrigin
    : 'https://socialdevtechnologies.com';

  // What the server-side Meta Purchase event needs to be matched to this buyer.
  // Paystack calls the webhook, not the buyer's browser, so the webhook can't see
  // these itself: capture them here and read them back from the signed metadata.
  // The browser sends only fbp/fbc (cookies it alone can read); address and
  // browser come from this request. Shapes are validated, nothing is trusted.
  const buyer = requestClient(req);
  const capi = {
    ...(cleanFbp(body.capi?.fbp) ? { fbp: cleanFbp(body.capi.fbp) } : {}),
    ...(cleanFbc(body.capi?.fbc) ? { fbc: cleanFbc(body.capi.fbc) } : {}),
    ...(buyer.ip ? { ip: buyer.ip.slice(0, 64) } : {}),
    ...(buyer.userAgent ? { ua: buyer.userAgent.slice(0, 400) } : {}),
  };

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user?.email ?? lead.email,
      amount: amountNaira * 100, // kobo
      currency: 'NGN',
      reference,
      metadata: {
        ...(user ? { user_id: user.id } : { lead_id: lead.id }),
        plan,
        ...(upgradeFrom ? { upgrade_from: upgradeFrom } : {}),
        // paystack-webhook marks this application redeemed once the payment is verified.
        ...(scholarshipId ? { scholarship_id: scholarshipId } : {}),
        // paystack-webhook redeems this code once the payment is verified.
        ...(coupon ? { coupon_id: coupon.id } : {}),
        // paystack-webhook attributes this referral if the buyer has none yet.
        ...(referralCode ? { referral_code: referralCode } : {}),
        // paystack-webhook uses this for the server-side Meta Purchase event only.
        capi,
      },
      // A guest has no session to land in /dashboard with: send them to a page
      // that confirms the payment and gets them logged in with an emailed code.
      callback_url: `${callbackOrigin}${user ? '/dashboard' : '/checkout/complete'}`,
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
  // Guests are tracked in checkout_leads instead (no user id to attach yet).
  try {
    if (user) {
      await serviceClient.from('checkout_attempts').insert({
        user_id: user.id,
        plan,
        provider_reference: reference,
      });
    }
  } catch (_err) {
    // non-fatal — see comment above
  }

  return jsonResponse({ authorization_url: data.data.authorization_url });
});
