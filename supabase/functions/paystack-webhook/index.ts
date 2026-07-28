import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Set PAYSTACK_SECRET_KEY in your Supabase Edge Function secrets — Paystack
// signs webhooks with your secret key directly (no separate webhook secret).
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';

// Expected NGN prices — must match Pricing.jsx and create-paystack-checkout
// exactly. The ₦100,000 shown struck through on the Builder cards is a
// marketing anchor, never a real charge amount — never add it here.
const PRICES = {
  builder1: 50000,
  builder2: 50000,
  pro: 90000,
};
const AMOUNT_TOLERANCE = 1;

const PLAN_LABELS = { builder1: 'Builder 1', builder2: 'Builder 2', pro: 'Pro' };

function emailShell(innerHtml) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#FBFAFF;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:18px;font-weight:800;color:#1A1333;">Social Dev <span style="color:#7C3AED;">Technologies</span></span>
      </div>
      ${innerHtml}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #EEE6FB;font-size:12px;color:#8A82AD;text-align:center;">
        Social Dev Technologies · You're receiving this because you have an account with us.<br/>
        Questions? Reply to this email or contact support@socialdevtechnologies.com.
      </div>
    </div>
  `;
}

async function sendResendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Social Dev Technologies <notifications@socialdevtechnologies.com>',
      to: [to],
      subject,
      html,
    }),
  });
  return res.ok;
}

// Cohort dates are purely informational (access is instant/self-paced on
// purchase regardless), but surfacing an upcoming date here still helps a
// buyer know when live/group activity around their tier kicks off.
async function buildCohortLines(supabase, plan) {
  const tiers = plan === 'pro' ? ['builder1', 'builder2'] : [plan];
  const { data } = await supabase.from('cohort_schedule').select('tier, start_date').in('tier', tiers);
  const labels = { builder1: 'Builder 1', builder2: 'Builder 2' };
  const today = new Date(new Date().toDateString());
  const lines = (data || [])
    .filter((row) => row.start_date && new Date(`${row.start_date}T00:00:00`) >= today)
    .map((row) => {
      const formatted = new Date(`${row.start_date}T00:00:00`).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      return `<li>${labels[row.tier]} cohort starts <strong>${formatted}</strong></li>`;
    });
  if (lines.length === 0) return '';
  return `<ul style="font-size:14px;color:#3A3358;line-height:1.7;padding-left:20px;margin:16px 0;">${lines.join('')}</ul>`;
}

function welcomeHtml(name, planLabel, cohortLines) {
  return `
    <p style="font-size:15px;color:#1A1333;">Hey ${name},</p>
    <p style="font-size:15px;color:#3A3358;line-height:1.6;">
      You're in! Your <strong>${planLabel}</strong> access is live right now, for the next 6 months.
    </p>
    ${cohortLines}
    <p style="font-size:15px;color:#3A3358;line-height:1.6;">A few things before you start building:</p>
    <ul style="font-size:14px;color:#3A3358;line-height:1.7;padding-left:20px;">
      <li>You'll need your own paid Claude account (Claude Pro or higher) to follow the builds — billed separately by Anthropic.</li>
      <li>Every session ends with a portfolio write-up prompt — that's what makes this resume-ready, don't skip it.</li>
      <li>Stuck on a build? Reach us on WhatsApp: <a href="https://wa.me/2349066006963" style="color:#7C3AED;">wa.me/2349066006963</a></li>
    </ul>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://socialdevtechnologies.com/dashboard"
         style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
        Go to my dashboard →
      </a>
    </div>
  `;
}

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

  // A real charge came through for this reference — mark the matching
  // checkout_attempts row resolved so the abandoned-checkout reminder never
  // emails someone who actually completed payment. Best-effort: this must
  // never block granting the entitlement below.
  try {
    await supabase
      .from('checkout_attempts')
      .update({ resolved_at: new Date().toISOString() })
      .eq('provider_reference', txId);
  } catch (_err) {
    // non-fatal — see comment above
  }

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

  // Welcome email — best-effort, must never block the entitlement grant
  // above or this webhook's 200 response back to Paystack. The idempotency
  // check earlier in this handler already means this only ever fires once
  // per unique transaction, even across retried webhook deliveries.
  try {
    if (RESEND_API_KEY) {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', userId)
        .maybeSingle();
      const recipientEmail = profileRow?.email || email;
      if (recipientEmail) {
        const name = profileRow?.display_name || recipientEmail.split('@')[0];
        const planLabel = PLAN_LABELS[plan] || plan;
        const cohortLines = await buildCohortLines(supabase, plan);
        const subject = `Welcome to ${planLabel} — you're in!`;
        const ok = await sendResendEmail(recipientEmail, subject, emailShell(welcomeHtml(name, planLabel, cohortLines)));
        if (ok) {
          await supabase.from('email_log').insert({
            user_id: userId,
            email: recipientEmail,
            email_type: 'welcome',
            subject,
            metadata: { plan },
          });
        }
      }
    }
  } catch (_err) {
    // non-fatal — see comment above
  }

  return new Response('OK', { status: 200 });
});
