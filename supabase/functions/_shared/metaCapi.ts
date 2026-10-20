// Meta Conversions API (server-side events) for the site's one pixel.
//
// Used by paystack-webhook (Purchase) and meta-capi (ViewContent, relayed from
// the browser). Both send the SAME event_name + event_id the browser pixel used,
// which is how Meta de-duplicates the pair into one event; see src/lib/pixel.js.
//
// Secrets (Supabase Edge Function secrets):
//   META_CAPI_ACCESS_TOKEN  required. Events Manager -> the dataset -> Settings ->
//                           Conversions API -> Generate access token. Without it
//                           every send is skipped (logged once per cold start).
//   META_PIXEL_ID           optional, defaults to the site's pixel.
//   META_TEST_EVENT_CODE    optional. While set, every event goes to the dataset's
//                           "Test events" tab instead of being counted. Unset it
//                           once verified.
//   GRAPH_API_VERSION       optional, shared with the WhatsApp functions.
//
// Nothing here may ever throw into its caller: tracking must not be able to fail
// a payment webhook or a page view.

const PIXEL_ID = Deno.env.get('META_PIXEL_ID') ?? '1495611502404463';
const ACCESS_TOKEN = Deno.env.get('META_CAPI_ACCESS_TOKEN') ?? '';
const TEST_EVENT_CODE = Deno.env.get('META_TEST_EVENT_CODE') ?? '';
const GRAPH_API_VERSION = Deno.env.get('GRAPH_API_VERSION') ?? 'v22.0';
const SEND_TIMEOUT_MS = 4000;

export const SITE_ORIGIN = 'https://socialdevtechnologies.com';

export const isTestMode = () => TEST_EVENT_CODE !== '';

export interface CapiUserData {
  email?: string | null; // raw; hashed here
  phone?: string | null; // raw, any format; hashed here as digits only
  externalId?: string | null; // raw; hashed here
  clientIp?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export interface CapiEvent {
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  userData: CapiUserData;
  customData?: Record<string, unknown>;
}

// Meta wants lowercase hex SHA-256 of the normalised value.
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Strict shapes, so a forged value from the browser can't put junk in the payload.
const FBP_RE = /^fb\.[0-2]\.\d{10,13}\.\d{1,20}$/;
const FBC_RE = /^fb\.[0-2]\.\d{10,13}\.[A-Za-z0-9_-]{1,500}$/;
export const cleanFbp = (v: unknown) => (typeof v === 'string' && FBP_RE.test(v) ? v : undefined);
export const cleanFbc = (v: unknown) => (typeof v === 'string' && FBC_RE.test(v) ? v : undefined);

// The real customer address and browser, from the request that reached us.
export function requestClient(req: Request): { ip: string | null; userAgent: string | null } {
  const ip = (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0] ??
    ''
  ).trim();
  return { ip: ip || null, userAgent: req.headers.get('user-agent') };
}

// `value` for a purchase must be a real amount: a number greater than zero, never
// a string, a symbol or a default. Returns null when it isn't, and the caller
// then sends nothing rather than a placeholder (Meta flags those).
export function purchaseValue(amount: unknown): number | null {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

async function buildUserData(u: CapiUserData) {
  const out: Record<string, unknown> = {};
  const email = u.email?.trim().toLowerCase();
  if (email) out.em = [await sha256Hex(email)];
  const phone = u.phone?.replace(/\D/g, '');
  if (phone && phone.length >= 8) out.ph = [await sha256Hex(phone)];
  if (u.externalId) out.external_id = [await sha256Hex(u.externalId)];
  if (u.clientIp) out.client_ip_address = u.clientIp;
  if (u.clientUserAgent) out.client_user_agent = u.clientUserAgent;
  if (u.fbp) out.fbp = u.fbp;
  if (u.fbc) out.fbc = u.fbc;
  return out;
}

let warnedNoToken = false;

// Returns true when Meta accepted the event. Never throws.
export async function sendCapiEvent(event: CapiEvent): Promise<boolean> {
  if (!ACCESS_TOKEN) {
    if (!warnedNoToken) {
      warnedNoToken = true;
      console.warn('meta capi: META_CAPI_ACCESS_TOKEN is not set, server events are being skipped');
    }
    return false;
  }
  try {
    const body: Record<string, unknown> = {
      data: [
        {
          event_name: event.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event.eventId,
          event_source_url: event.eventSourceUrl,
          action_source: 'website',
          user_data: await buildUserData(event.userData),
          ...(event.customData ? { custom_data: event.customData } : {}),
        },
      ],
      ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
    };
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${PIXEL_ID}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In a header, not the URL, so it can't end up in a request log.
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('meta capi: rejected', event.eventName, res.status, detail.slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error('meta capi: send failed', event.eventName, (err as Error)?.message);
    return false;
  }
}
