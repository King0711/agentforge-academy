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
//
// Cut from 50000/50000/90000 to 25000/25000/45000 (2026-09-02), matching
// create-paystack-checkout exactly — these two constants must move
// together or a real payment gets flagged 'flagged_unrecognized_amount'
// and no entitlement or credits are granted despite the charge succeeding.
const PRICES = {
  builder1: 25000,
  builder2: 25000,
  pro: 45000,
};
const AMOUNT_TOLERANCE = 1;

// Paystack can add its own transaction fee on top of the amount we set at
// checkout, if this account's "customer bears the fee" preference is on
// (Paystack Dashboard → Settings → Preferences → Transaction fees). When
// that's on, the amount that actually lands here is price + fee, not price
// exactly — local cards run ~1.5% + ₦100, international cards ~3.9% + ₦100,
// both capped, which tops out around 4% at our price points. 6% gives
// headroom without being loose enough to wave through a genuinely wrong
// amount. This does NOT relax the floor — amountNaira still can't be below
// the listed price (minus AMOUNT_TOLERANCE for rounding).
const FEE_CEILING_MULTIPLIER = 1.06;

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

// Constant-time comparison — a plain `===`/`!==` on the hex strings would
// short-circuit on the first differing character, leaking a timing signal
// an attacker could use to guess the correct signature byte-by-byte.
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
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

  const withinRange = (price) =>
    amountNaira >= price - AMOUNT_TOLERANCE && amountNaira <= price * FEE_CEILING_MULTIPLIER;

  if (metadataPlan && Object.hasOwn(PRICES, metadataPlan) && withinRange(PRICES[metadataPlan])) {
    return metadataPlan;
  }
  if (withinRange(PRICES.pro)) return 'pro';
  return null;
}

serve(async (req) => {
  const rawBody = await req.text();

  // Verify HMAC-SHA512 signature — proves this request genuinely came from
  // Paystack and that its payload (including metadata we set at checkout
  // creation) hasn't been tampered with.
  const signature = req.headers.get('x-paystack-signature') ?? '';
  const expected = await hmacSha512Hex(PAYSTACK_SECRET_KEY, rawBody);
  if (!timingSafeEqual(signature, expected)) {
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

  // AI Builder Credits — deliberately after the entitlement update and
  // wrapped so a failure here can never undo or block it: a student who
  // paid keeps their access even if this fails, and support can grant
  // credits manually from /admin/ai-credits. Amounts are read from
  // ai_platform_settings, not hardcoded, so an admin can change the
  // allotment without a redeploy.
  //
  // The description embeds txId, which is unique per real transaction —
  // that is what actually protects a genuine renewal months later from
  // being mistaken for a duplicate, on top of ai_grant_credits' own
  // 24-hour idempotency window (see its definition for the incident that
  // window exists to prevent). The webhook's own idempotency check above
  // (on payments.provider_transaction_id) already means a retried
  // delivery never reaches this line at all for the same transaction.
  try {
    const grantField = { builder1: 'grant_builder1', builder2: 'grant_builder2', pro: 'grant_pro' }[plan];
    const { data: settings } = await supabase
      .from('ai_platform_settings')
      .select(grantField)
      .eq('id', true)
      .maybeSingle();
    const creditAmount = settings?.[grantField];
    if (creditAmount > 0) {
      await supabase.rpc('ai_grant_credits', {
        p_user_id: userId,
        p_amount: creditAmount,
        p_type: 'initial_allocation',
        p_description: `${PLAN_LABELS[plan] || plan} purchase ${txId}`,
      });
    }
  } catch (_err) {
    // non-fatal — see comment above
  }

  const { data: paymentRow } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      provider: 'paystack',
      provider_transaction_id: txId,
      amount: amountNaira,
      currency,
      plan,
      status: 'granted',
    })
    .select('id')
    .single();

  // Referral payout — best-effort and isolated from the grant above: a
  // referrals-table hiccup must never cost a real student their entitlement.
  // This only ever creates a 'pending' ledger row; an admin marks it paid
  // by hand later (admin_mark_referral_earning_paid in referrals-setup.sql)
  // — there is no automatic transfer anywhere in this flow.
  //
  // At most one payout per referred student, ever, no matter how many
  // separate plans they go on to buy — referral_earnings.referral_id is
  // UNIQUE, so `ignoreDuplicates` here is just avoiding a thrown error on
  // the expected-common case of a second qualifying purchase; the database
  // constraint is what actually enforces the cap.
  try {
    if (paymentRow?.id) {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id, referrer_id')
        .eq('referred_user_id', userId)
        .maybeSingle();

      if (referral) {
        await supabase.from('referral_earnings').upsert(
          {
            referral_id: referral.id,
            referrer_id: referral.referrer_id,
            payment_id: paymentRow.id,
            plan,
          },
          { onConflict: 'referral_id', ignoreDuplicates: true },
        );
      }
    }
  } catch (_err) {
    // non-fatal — see comment above
  }

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
