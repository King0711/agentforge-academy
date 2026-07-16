import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Set FLUTTERWAVE_SECRET_HASH in your Supabase Edge Function secrets
const SECRET_HASH = Deno.env.get('FLUTTERWAVE_SECRET_HASH') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  // Flutterwave sends the secret hash as verif-hash header
  const hash = req.headers.get('verif-hash');
  if (hash !== SECRET_HASH) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await req.json();

  // Only act on successful charge events
  if (payload.event !== 'charge.completed' || payload.data?.status !== 'successful') {
    return new Response('Ignored', { status: 200 });
  }

  const email = payload.data?.customer?.email;
  if (!email) return new Response('No email', { status: 400 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Find the user by email
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .limit(1);

  if (!users?.length) return new Response('User not found', { status: 404 });

  // Set pro access for 31 days (monthly billing)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 31);

  await supabase
    .from('profiles')
    .update({
      is_pro: true,
      pro_expires_at: expiresAt.toISOString(),
      payment_provider: 'flutterwave',
    })
    .eq('id', users[0].id);

  return new Response('OK', { status: 200 });
});
