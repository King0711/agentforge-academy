import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

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

// Shared branded wrapper so every outbound email looks consistent, with a
// footer identifying the sender and giving a reply-to path — basic good
// practice for any account-based transactional/marketing email.
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

function isActive(expiresAt) {
  return Boolean(expiresAt) && new Date(expiresAt) > new Date();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { subject, html, segment } = body;
  if (!subject || !html) return jsonResponse({ error: 'subject and html are required' }, 400);
  const validSegments = ['all', 'builder1', 'builder2', 'pro'];
  if (!validSegments.includes(segment)) return jsonResponse({ error: 'Invalid segment' }, 400);

  // Reuse the existing admin_get_all_profiles RPC to both fetch the audience
  // AND enforce the admin check — it raises 'Unauthorized' internally for a
  // non-admin caller, so we don't need to duplicate that logic here.
  const authHeader = req.headers.get('Authorization') ?? '';
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: profiles, error: rpcError } = await callerClient.rpc('admin_get_all_profiles');
  if (rpcError) return jsonResponse({ error: rpcError.message }, 403);

  const recipients = (profiles || []).filter((p) => {
    if (!p.email) return false;
    if (segment === 'all') return true;
    if (segment === 'builder1') return isActive(p.builder1_expires_at);
    if (segment === 'builder2') return isActive(p.builder2_expires_at);
    if (segment === 'pro') return isActive(p.builder1_expires_at) && isActive(p.builder2_expires_at);
    return false;
  });

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const finalHtml = emailShell(html);
  let sent = 0;

  for (const recipient of recipients) {
    const ok = await sendResendEmail(recipient.email, subject, finalHtml);
    if (ok) {
      sent += 1;
      await serviceClient.from('email_log').insert({
        user_id: recipient.id,
        email: recipient.email,
        email_type: 'broadcast',
        subject,
        metadata: { segment },
      });
    }
  }

  return jsonResponse({ ok: true, matched: recipients.length, sent });
});
