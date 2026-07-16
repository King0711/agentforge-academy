import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { hmac } from 'https://deno.land/x/hmac@v2.0.1/mod.ts';

// Set LEMONSQUEEZY_WEBHOOK_SECRET in your Supabase Edge Function secrets
const WEBHOOK_SECRET = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  const rawBody = await req.text();

  // Verify HMAC-SHA256 signature
  const signature = req.headers.get('x-signature') ?? '';
  const expected = await hmac('sha256', WEBHOOK_SECRET, rawBody, 'utf8', 'hex');
  if (signature !== expected) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventName = payload.meta?.event_name;

  // Handle subscription_created and subscription_payment_success
  if (!['subscription_created', 'subscription_payment_success'].includes(eventName)) {
    return new Response('Ignored', { status: 200 });
  }

  const email = payload.data?.attributes?.user_email;
  if (!email) return new Response('No email', { status: 400 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .limit(1);

  if (!users?.length) return new Response('User not found', { status: 404 });

  // Set pro access for 31 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 31);

  await supabase
    .from('profiles')
    .update({
      is_pro: true,
      pro_expires_at: expiresAt.toISOString(),
      payment_provider: 'lemonsqueezy',
    })
    .eq('id', users[0].id);

  return new Response('OK', { status: 200 });
});
