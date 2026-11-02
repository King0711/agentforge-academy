import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

// One reminder per Vibe Coding class, about an hour before it starts. The cron job
// (vibecoding-class-reminder-1h, see supabase/vibecoding-class-reminders.sql) calls
// this every 10 minutes through the evening; the function looks for a vibecoding
// live_sessions row starting within the next 65 minutes, so it follows whatever
// date and time the admin gives a class instead of hardcoding the schedule. A tick
// with no class in that window is a no-op. Each person gets each class's email once
// (email_log, keyed by session id), so repeat ticks and manual runs never double-send.
// A student who pays after the first tick but before the class starts still gets it.
const EMAIL_TYPE = 'vibecoding_class_reminder_1h';
const WINDOW_MS = 65 * 60 * 1000;

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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

// Names and titles come from user-controlled or admin-typed data, so escape them
// before they go into email HTML.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function emailShell(innerHtml) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#F6F8FB;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:18px;font-weight:800;color:#0F1A2A;">Social Dev <span style="color:#264D73;">Technologies</span></span>
      </div>
      ${innerHtml}
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E7ECF2;font-size:12px;color:#4A5B6C;text-align:center;">
        Social Dev Technologies · You're receiving this because you registered for the Vibe Coding Bootcamp.<br/>
        Need help? Message us on WhatsApp: <a href="https://wa.me/2349066006963" style="color:#264D73;">wa.me/2349066006963</a>
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

// "Class 3 of 8 — Week 2" -> 3. Falls back to null if the description is free text.
function classNumberOf(description) {
  const m = /Class\s+(\d+)\s+of\s+\d+/i.exec(description ?? '');
  return m ? Number(m[1]) : null;
}

// The join link is the class's Zoom link (it carries the meeting passcode, so it is
// read server-side and only ever goes to enrolled students). Only an https URL is
// used; with no usable link the email points at the dashboard's Live Sessions.
function reminderHtml(name, classLabel, title, timeLabel, joinLink) {
  const button = joinLink
    ? `
    <div style="text-align:center;margin:28px 0;">
      <a href="${escapeHtml(joinLink)}"
         style="display:inline-block;background:#264D73;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
        Join the class →
      </a>
    </div>
    <p style="font-size:13px;color:#4A5B6C;line-height:1.6;word-break:break-all;">
      Button not working? Copy this link into your browser:<br/>
      <a href="${escapeHtml(joinLink)}" style="color:#264D73;">${escapeHtml(joinLink)}</a>
    </p>`
    : `
    <div style="text-align:center;margin:28px 0;">
      <a href="https://socialdevtechnologies.com/dashboard/live-sessions"
         style="display:inline-block;background:#264D73;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">
        Open my live sessions →
      </a>
    </div>`;
  return `
    <p style="font-size:15px;color:#0F1A2A;">Hey ${escapeHtml(name)},</p>
    <p style="font-size:15px;color:#1F2C3D;line-height:1.6;">
      Your <strong>Vibe Coding Bootcamp</strong> class starts in <strong>1 hour</strong>:
    </p>
    <p style="font-size:15px;color:#1F2C3D;line-height:1.6;margin:0;">
      <strong>${escapeHtml(classLabel)}${escapeHtml(title)}</strong><br/>
      ${escapeHtml(timeLabel)}
    </p>
    ${button}
    <p style="font-size:14px;color:#1F2C3D;line-height:1.6;">
      The link is also on your dashboard under <strong>Live Sessions</strong>:
      <a href="https://socialdevtechnologies.com/dashboard/live-sessions" style="color:#264D73;">open my dashboard</a>.
      Open your laptop and sign in to your AI assistant a few minutes early so we can start on time.
      If you can't make it live, the recording is added to your dashboard after class.
    </p>
  `;
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const cronHeader = req.headers.get('x-cron-secret') ?? '';
  const isAutomatedRun = Boolean(CRON_SECRET) && cronHeader === CRON_SECRET;

  // Same gate as the other reminder functions: the cron secret, or a signed-in
  // admin (checked by calling an admin-only RPC as the caller).
  if (!isAutomatedRun) {
    const authHeader = req.headers.get('Authorization') ?? '';
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { error: authError } = await callerClient.rpc('admin_get_email_settings');
    if (authError) return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  let body: { dryRun?: boolean } = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    // no body (cron) — a real run
  }
  const dryRun = body.dryRun === true;

  const nowMs = Date.now();
  const { data: sessions, error: sessErr } = await serviceClient
    .from('live_sessions')
    .select('id, title, description, session_date, join_link')
    .eq('tier', 'vibecoding')
    .gt('session_date', new Date(nowMs).toISOString())
    .lte('session_date', new Date(nowMs + WINDOW_MS).toISOString())
    .order('session_date');
  if (sessErr) {
    console.error('live_sessions query failed:', sessErr.message);
    return jsonResponse({ error: 'Could not load upcoming classes' }, 500);
  }
  if (!sessions || sessions.length === 0) {
    return jsonResponse({ ok: true, skipped: true, reason: 'No Vibe Coding class starts in the next hour' });
  }

  const results = [];
  for (const s of sessions) {
    const { data: candidates, error: candErr } = await serviceClient.rpc('service_get_vibecoding_reminder_candidates', {
      p_session_id: s.id,
    });
    if (candErr) {
      console.error('service_get_vibecoding_reminder_candidates failed:', candErr.message);
      return jsonResponse({ error: 'Could not load registrants' }, 500);
    }

    // Dedup: never send the same class's reminder to the same person twice.
    const { data: alreadySent } = await serviceClient
      .from('email_log')
      .select('user_id')
      .eq('email_type', EMAIL_TYPE)
      .contains('metadata', { session_id: s.id });
    const sentSet = new Set((alreadySent || []).map((r) => r.user_id));
    const todo = (candidates || []).filter((c) => c.email && !sentSet.has(c.user_id));

    if (dryRun) {
      results.push({ sessionId: s.id, title: s.title, registered: (candidates || []).length, wouldSend: todo.length, joinLinkSet: Boolean(s.join_link) });
      continue;
    }

    const num = classNumberOf(s.description);
    const classLabel = num ? `Class ${num}: ` : '';
    const timeLabel = new Date(s.session_date).toLocaleString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos',
    }) + ' WAT';
    const link = String(s.join_link ?? '').trim();
    const joinLink = /^https:\/\/\S+$/.test(link) ? link : null;
    const subject = `Starting in 1 hour: Vibe Coding ${num ? `Class ${num}` : 'class'}, 7 PM WAT`;

    let sent = 0;
    for (const c of todo) {
      const name = c.display_name || c.email.split('@')[0];
      const ok = await sendResendEmail(c.email, subject, emailShell(reminderHtml(name, classLabel, s.title, timeLabel, joinLink)));
      if (ok) {
        sent += 1;
        const { error: logErr } = await serviceClient.from('email_log').insert({
          user_id: c.user_id,
          email: c.email,
          email_type: EMAIL_TYPE,
          subject,
          metadata: { session_id: s.id },
        });
        // A failed insert blinds the dedupe above, so say so rather than swallow it.
        if (logErr) console.error('email_log insert failed:', logErr.code, logErr.message);
      }
    }
    results.push({ sessionId: s.id, title: s.title, registered: (candidates || []).length, matched: todo.length, sent, joinLinkSet: Boolean(joinLink) });
  }

  return jsonResponse({ ok: true, ...(dryRun ? { dryRun: true } : {}), sessions: results });
});
