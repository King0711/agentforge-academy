import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { rateLimit } from '../_shared/rateLimit.ts';

// Self-serve account deletion (supabase/account-deletion.sql does the data work).
// Deploy with verify_jwt = true (the default). The caller is identified ONLY by the
// JWT, never by anything in the body; the body just carries the typed email as a
// deliberate "are you sure" step. Anyone with a stolen session could still delete the
// account, so the email must also match the confirmed address on the auth record.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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

const REFUSALS: Record<string, string> = {
  admin_account: 'Team accounts can’t be deleted from here. Message us on WhatsApp and we’ll sort it out.',
  pending_referral_earnings:
    'There’s referral commission still waiting to be paid on this account. Message us on WhatsApp and we’ll settle it first, then delete the account for you.',
};

serve(async (req) => {
  const cors = corsHeadersFor(req);
  const json = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Please sign in again.' }, 401);
  const { data: auth, error: authErr } = await sb.auth.getUser(token);
  const user = auth?.user;
  if (authErr || !user || !user.email) return json({ error: 'Please sign in again.' }, 401);

  // Each wrong email costs an attempt, so a stolen session can't guess its way past the
  // confirmation. Fails closed: this endpoint is destructive.
  const blocked = await rateLimit(
    sb, req,
    { bucket: 'delete-account', key: user.id, limit: 5, windowSeconds: 3600, failClosed: true },
    cors,
    'Too many attempts. Please wait an hour, or message us on WhatsApp.',
  );
  if (blocked) return blocked;

  let body: { confirmEmail?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Bad request' }, 400);
  }
  const typed = typeof body.confirmEmail === 'string' ? body.confirmEmail.trim().toLowerCase() : '';
  if (!typed || typed !== user.email.toLowerCase()) {
    return json({ error: 'The email you typed doesn’t match this account.' }, 400);
  }

  const { data, error } = await sb.rpc('delete_account_data', { p_user: user.id });
  if (error) {
    console.error('delete_account_data failed', user.id, error.message);
    return json({ error: 'Something went wrong and nothing was deleted. Please try again, or message us on WhatsApp.' }, 500);
  }
  if (!data?.ok) {
    const msg = REFUSALS[data?.reason as string];
    if (msg) return json({ error: msg, reason: data.reason }, 409);
    return json({ error: 'We couldn’t delete this account. Please message us on WhatsApp.' }, 500);
  }
  return json({ ok: true });
});
