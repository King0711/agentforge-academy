import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Sends a personal reply to a customer from the business WhatsApp number, so
// an escalated conversation stays in one thread instead of arriving from
// whatever personal number the owner happens to be holding. Called from
// /admin/support (AdminSupport.jsx) via supabase.functions.invoke.
const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN') ?? '';
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') ?? '';
const GRAPH_API_VERSION = Deno.env.get('GRAPH_API_VERSION') ?? 'v22.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// WhatsApp only allows free-form messages within 24h of the customer's last
// message. Past that, Meta rejects anything but a pre-approved template — so
// check it here and say so plainly, rather than surfacing a raw Graph error.
const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_REPLY_CHARS = 4000;

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/socialdevtechnologies\.com$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];

function corsHeadersFor(req: Request) {
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

  function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    // Identify the caller from their JWT — never trust a client-supplied id.
    const authHeader = req.headers.get('Authorization') ?? '';
    const asCaller = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await asCaller.auth.getUser();
    if (userError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // This endpoint sends messages to the public from the company's number.
    // Being merely signed in is not enough.
    const { data: entitlement } = await admin
      .from('entitlements')
      .select('is_admin')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!entitlement?.is_admin) return jsonResponse({ error: 'Not authorized' }, 403);

    const { phone, body } = await req.json();

    if (typeof phone !== 'string' || !/^\d{7,15}$/.test(phone)) {
      return jsonResponse({ error: 'Invalid phone number.' }, 400);
    }
    const text = typeof body === 'string' ? body.trim() : '';
    if (!text) return jsonResponse({ error: 'Message is empty.' }, 400);
    if (text.length > MAX_REPLY_CHARS) {
      return jsonResponse({ error: `Message is over ${MAX_REPLY_CHARS} characters.` }, 400);
    }

    // Only reply to someone who has actually messaged us, and only inside the
    // 24-hour window their last message opened.
    const { data: lastInbound } = await admin
      .from('whatsapp_messages')
      .select('created_at')
      .eq('wa_phone', phone)
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastInbound) {
      return jsonResponse({ error: 'No message from this number on record.' }, 400);
    }

    const age = Date.now() - new Date(lastInbound.created_at).getTime();
    if (age > SERVICE_WINDOW_MS) {
      return jsonResponse({
        error:
          "WhatsApp's 24-hour reply window has closed for this contact. "
          + 'Reach them by email, or wait for them to message again.',
      }, 409);
    }

    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'text',
          text: { preview_url: false, body: text },
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error('WhatsApp send failed:', res.status, detail);
      return jsonResponse({ error: `WhatsApp rejected the message (${res.status}).` }, 502);
    }

    const sent = await res.json();

    // Log it so the thread in /admin/support shows the reply, and so the
    // agent has it as context if the customer writes back.
    await admin.from('whatsapp_messages').insert({
      wa_message_id: sent?.messages?.[0]?.id ?? `admin_${crypto.randomUUID()}`,
      wa_phone: phone,
      direction: 'outbound',
      body: text,
    });

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('whatsapp-send-reply error:', err);
    return jsonResponse({ error: 'Something went wrong sending that.' }, 500);
  }
});
