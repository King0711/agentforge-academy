// Rate limiting for Edge Functions, backed by public.rate_limit_hit()
// (supabase/rate-limiting.sql). The counters live in Postgres, so the limit holds across
// cold starts and across the several instances an Edge Function runs on - an in-memory
// Map (what meta-capi used to do) resets on every one of them.
//
//   const blocked = await rateLimit(sb, req, { bucket: 'delete-account', key: user.id, limit: 5, windowSeconds: 3600 }, cors);
//   if (blocked) return blocked;
//
// `sb` must be a service-role client: rate_limit_hit is not callable by anon or
// authenticated. A caller with no usable key (no IP header and none supplied) is not
// limited rather than lumped into one shared bucket that would lock everyone out.
//
// Fails OPEN by default: if the counter can't be reached, the request goes through and
// the error is logged. A database blip must not take checkout down. Pass failClosed for
// an endpoint where letting abuse through is worse than refusing, such as a code guess.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface RateLimitRule {
  /** Names the limit, e.g. 'checkout:coupon'. Counters are per bucket + key. */
  bucket: string;
  /** Who is being limited: a user id, or omit to limit by the caller's IP. */
  key?: string;
  limit: number;
  windowSeconds: number;
  failClosed?: boolean;
}

const encoder = new TextEncoder();

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

// cf-connecting-ip is set by the edge proxy and can't be forged by the caller. The
// last x-forwarded-for entry is the one our own proxy appended; the first is whatever
// the caller claimed, so it is never trusted.
export function clientIp(req: Request): string | null {
  const ip = (
    req.headers.get('cf-connecting-ip') ??
    (req.headers.get('x-forwarded-for') ?? '').split(',').pop() ??
    ''
  ).trim();
  return ip || null;
}

// Stored hashed, never raw: a counter table has no business holding addresses.
export async function ipKey(req: Request): Promise<string | null> {
  const ip = clientIp(req);
  if (!ip) return null;
  const pepper = Deno.env.get('RATE_LIMIT_SALT') ?? '';
  return (await sha256Hex(`${pepper}|${ip}`)).slice(0, 32);
}

export function tooManyRequests(
  retryAfter: number,
  cors: Record<string, string> = {},
  message = 'Too many requests. Please wait a moment and try again.',
): Response {
  return new Response(JSON.stringify({ error: message, code: 'rate_limited', retry_after: retryAfter }), {
    status: 429,
    headers: { ...cors, 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) },
  });
}

/** Returns a 429 Response when the caller is over the limit, otherwise null. */
export async function rateLimit(
  sb: SupabaseClient,
  req: Request,
  rule: RateLimitRule,
  cors: Record<string, string> = {},
  message?: string,
): Promise<Response | null> {
  const key = rule.key ?? (await ipKey(req));
  if (!key) return null;

  const { data, error } = await sb.rpc('rate_limit_hit', {
    p_bucket: rule.bucket,
    p_key: key,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) {
    console.error('rate limit check failed:', rule.bucket, error?.message);
    return rule.failClosed ? tooManyRequests(rule.windowSeconds, cors, message) : null;
  }
  if (row.allowed) return null;
  return tooManyRequests(Number(row.retry_after) || rule.windowSeconds, cors, message);
}
