import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function emailShell(innerHtml) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#FBFAFF;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:18px;font-weight:800;color:#1A1333;">Social Dev <span style="color:#7C3AED;">Technologies</span></span>
      </div>
      ${innerHtml}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #EEE6FB;font-size:12px;color:#8A82AD;text-align:center;">
        Social Dev Technologies · You're receiving this because you have an account with us.<br/>
        Questions? Reply to this email or contact support@socialdevtech.com.
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
      // TEMPORARY: Resend's shared sandbox sender, since no custom domain is
      // verified yet — this can only deliver to the Resend account's own
      // signup email. Switch back to notifications@socialdevtech.com (or
      // whatever domain gets verified) once that's set up.
      from: 'Social Dev Technologies <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  });
  return res.ok;
}

const TIER_LABELS = { builder1: 'Builder 1', builder2: 'Builder 2' };

function cohortReminderHtml(name, tierLabel, startDateFormatted) {
  return `
    <p style="font-size:15px;color:#1A1333;">Hey ${name},</p>
    <p style="font-size:15px;color:#3A3358;line-height:1.6;">
      Your <strong>${tierLabel}</strong> cohort starts <strong>${startDateFormatted}</strong>.
      If you haven't started building yet, now's a great time to get ahead of the group.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="https://socialdevtechnologies.com/dashboard"
         style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
        Go to my dashboard →
      </a>
    </div>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const cronHeader = req.headers.get('x-cron-secret') ?? '';
  const isAutomatedRun = Boolean(CRON_SECRET) && cronHeader === CRON_SECRET;

  const { data: settings, error: settingsError } = await serviceClient
    .from('email_settings')
    .select('cohort_reminder_automation_enabled')
    .eq('id', 1)
    .single();
  if (settingsError || !settings) return jsonResponse({ error: 'Could not load email settings' }, 500);

  if (isAutomatedRun) {
    if (!settings.cohort_reminder_automation_enabled) {
      return jsonResponse({ ok: true, skipped: true, reason: 'Automation disabled' });
    }
  } else {
    const authHeader = req.headers.get('Authorization') ?? '';
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { error: authError } = await callerClient.rpc('admin_get_email_settings');
    if (authError) return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  const { data: candidates, error: queryError } = await serviceClient.rpc('service_get_cohort_reminder_candidates', {
    p_days_ahead: 3,
  });
  if (queryError) return jsonResponse({ error: queryError.message }, 500);

  let sent = 0;
  for (const c of candidates || []) {
    if (!c.email) continue;
    const name = c.display_name || c.email.split('@')[0];
    const tierLabel = TIER_LABELS[c.tier] || c.tier;
    const startDateFormatted = new Date(`${c.start_date}T00:00:00`).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const subject = `Your ${tierLabel} cohort starts ${startDateFormatted}`;
    const ok = await sendResendEmail(c.email, subject, emailShell(cohortReminderHtml(name, tierLabel, startDateFormatted)));
    if (ok) {
      sent += 1;
      await serviceClient.from('email_log').insert({
        user_id: c.user_id,
        email: c.email,
        email_type: 'cohort_reminder',
        subject,
        metadata: { tier: c.tier, start_date: c.start_date },
      });
    }
  }

  return jsonResponse({ ok: true, matched: (candidates || []).length, sent });
});
