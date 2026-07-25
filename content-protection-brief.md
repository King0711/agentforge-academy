# Content Protection Hardening — Implementation Brief for Claude Code

**Repo:** Social Dev Technologies Academy ("Agent Forge") — React 19 + Vite, Supabase (Postgres + Auth + Edge Functions, Deno), Paystack, deployed on Vercel.

**Why this exists:** the curriculum outline (44 agent builds) ships fully in the public JS bundle regardless of payment status, and the paid session content (`course_content`), while correctly RLS-gated against non-payers, is fetched directly from the browser and can be bulk-exported by any single paying account in a short script. This brief closes both gaps without breaking existing UX. Work top to bottom — each phase is independently shippable.

Run `/plan` in Claude Code before touching anything — this repo has real payment and auth logic in production; no direct edits without a reviewed plan.

---

## Phase 0 — Version-control the paywall you already built

`course_content`'s table definition and RLS policy exist only in the live Supabase project — they're the one privileged table missing from `supabase/schema.sql` (compare to how `profiles`, `entitlements`, `progress`, `payments` are documented there).

- [ ] Pull the live `course_content` schema + policies (Supabase dashboard → Database → Tables, and Authentication → Policies, or `supabase db pull` if the CLI is linked).
- [ ] Add it to `supabase/schema.sql` in the same style as the existing tables (RLS enabled, explicit `select` policy gated on `entitlements.is_pro OR entitlements.is_admin`, no client insert/update policy).
- [ ] Acceptance: a fresh Supabase project run through `schema.sql` reproduces identical `course_content` access behavior to production.

No user-facing risk. Do this first regardless of anything else below.

---

## Phase 1 — Stop bulk export of paid content

Currently `useCourseContent.js` calls `supabase.from('course_content').select(...)` straight from the browser. RLS correctly blocks non-payers, but a paying Pro account can loop `course_id` 1–44 with the same client and have the whole paid catalog in under a minute. Fix: move the read behind an Edge Function (same pattern as `create-paystack-checkout`), so every read is logged and rate-limited server-side.

**1a. New table — add to `supabase/schema.sql`:**

```sql
create table if not exists public.content_access_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id integer not null,
  accessed_at timestamptz not null default now()
);

alter table public.content_access_log enable row level security;
-- No client policies at all — only the service role (inside the Edge Function) writes/reads this.

create index if not exists content_access_log_user_time_idx
  on public.content_access_log (user_id, accessed_at desc);
```

**1b. New Edge Function — `supabase/functions/get-course-content/index.ts`:**

Mirror the auth + CORS pattern already used in `create-paystack-checkout/index.ts` (verify the JWT via `supabase.auth.getUser()` off the forwarded `Authorization` header — never trust a client-supplied user id). Then:

1. Fetch the single `course_content` row for `course_id` first (this needs a new `difficulty text` column on `course_content` — see note below) using a **service-role** client (this function is the only place that should read `course_content` directly).
2. Look up `entitlements` (`is_admin`, `tier`, `tier_expires_at`, `world_class_until`) and decide access based on the row's difficulty: World Class rows require `world_class_until` in the future; everything else requires `tier = 'pro'` with `tier_expires_at` in the future. `is_admin` always passes.
3. Query `content_access_log` for that `user_id` in the last 10 minutes. If the count of **distinct** `course_id` values exceeds ~8, return `429` and insert a flag (see 1c) instead of the content — that request pattern has no legitimate reason to exist for a human working through lessons one at a time.
4. Otherwise, insert an access-log row and return the content.
5. Before returning, run the row through a watermark function (1d) so the `session` and `resources` text carries an invisible, user-specific marker.

**Note:** add `difficulty text not null` to `course_content` (matching the values already used in `agents*.js` — "Beginner"/"Intermediate"/"Advanced"/"World Class") so this function can decide gating from the row itself instead of trusting a client-supplied value.

```ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

// Encodes the first 8 hex chars of the user id as zero-width characters
// interleaved after the first word of the text. Invisible on screen and in
// most copy-paste, survivable through plain-text theft, decodable later by
// an admin script if leaked content ever surfaces elsewhere.
function watermark(text, userId) {
  if (!text) return text;
  const bits = [...userId.replace(/-/g, '').slice(0, 8)]
    .map((c) => parseInt(c, 16).toString(2).padStart(4, '0'))
    .join('');
  const marker = [...bits].map((b) => (b === '1' ? '​' : '‌')).join('');
  const idx = text.indexOf(' ');
  return idx === -1 ? text + marker : text.slice(0, idx) + marker + text.slice(idx);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await authed.auth.getUser();
  if (userError || !user) return json({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  const courseId = Number(body.course_id);
  if (!courseId) return json({ error: 'course_id required' }, 400);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Fetch the content row first — its `difficulty` decides which entitlement applies.
  const { data, error } = await admin
    .from('course_content')
    .select('difficulty, what_you_build, what_you_learn, session, starter_code, test_it_out, troubleshooting, resources')
    .eq('course_id', courseId)
    .maybeSingle();
  if (error || !data) return json({ locked: true }, 200);

  const { data: ent } = await admin
    .from('entitlements')
    .select('is_admin, tier, tier_expires_at, world_class_until')
    .eq('user_id', user.id)
    .single();

  const now = new Date();
  const proActive = ent?.tier === 'pro' && ent?.tier_expires_at && new Date(ent.tier_expires_at) > now;
  const worldClassActive = ent?.world_class_until && new Date(ent.world_class_until) > now;
  const isWorldClass = data.difficulty === 'World Class';
  const entitled = Boolean(ent?.is_admin || (isWorldClass ? worldClassActive : proActive));
  if (!entitled) return json({ locked: true }, 200); // matches useCourseContent's existing "locked" contract

  // Anomaly check: burst access across many distinct courses = scraping signature.
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { data: recent } = await admin
    .from('content_access_log')
    .select('course_id')
    .eq('user_id', user.id)
    .gte('accessed_at', since);
  const distinctCourses = new Set((recent ?? []).map((r) => r.course_id));
  if (distinctCourses.size > 8) {
    // TODO: also flip an `entitlements.flagged_for_review` bool (add via migration)
    // and reuse the notify-signup function's email pattern to alert an admin.
    return json({ error: 'Too many requests — slow down.' }, 429);
  }

  await admin.from('content_access_log').insert({ user_id: user.id, course_id: courseId });

  const { difficulty, ...content } = data; // difficulty was only needed for the gating decision above
  return json({
    locked: false,
    content: {
      ...content,
      session: watermark(content.session, user.id),
      resources: watermark(content.resources, user.id),
    },
  });
});
```

Set `verify_jwt = true` for this function (belt-and-suspenders on top of the manual `getUser()` check).

**1c.** Add a `flagged_for_review boolean not null default false` column to `entitlements` via migration, and surface it in Admin (Phase 3).

**1d.** Watermark decode is a 10-line offline script for admins only (reverse of the bit-encoding above) — don't ship it client-side.

**1e. Update `src/hooks/useCourseContent.js`:** replace the direct `.from('course_content').select(...)` call with `supabase.functions.invoke('get-course-content', { body: { course_id: courseId } })`, and map `{ locked, content }` from the response onto the existing `content` / `locked` state so no other component needs to change.

---

## Phase 2 — Decide on the free-tier metadata exposure

`src/data/agentsBeginner.js`, `agentsIntermediate.js`, `agentsAdvanced.js`, `agentsWorldClass.js` ship the full title, description, tech stack, prerequisites, department, and XP for all 44 builds in the public bundle — no login required, discoverable via devtools by anyone.

This is a product call for you and your partners, not a pure engineering one — full public metadata is good for SEO/shareability, bad for IP exposure. Recommendation: keep a public teaser (title, emoji, difficulty, one-line description) in the bundle for marketing pages, and move the richer fields (full description, tech stack, prerequisites, buildTime, tags) behind a `get-catalog` Edge Function that returns full metadata only to logged-in users, gated the same way as Phase 1. Flag this decision back once made — implementation mirrors Phase 1 almost exactly.

---

## Phase 3 — Admin visibility

Extend `src/pages/Admin.jsx` with a panel reading `content_access_log` (grouped by user, last 24h) and any `flagged_for_review = true` accounts, so scraping attempts are visible in the dashboard instead of theoretical. Reuses the existing `StatCard` / table patterns already in that file.

---

## Phase 4 — Terms of Service tightening

`src/pages/Legal.jsx`, section 5 ("Intellectual Property") already prohibits resale/redistribution — solid foundation, but has no language covering automated access or using the platform to build a competing product. Suggested addition (**have an actual IP/education attorney review before publishing — this is a starting draft, not legal advice**):

> "You may not access the Platform through automated means (scripts, bots, or scraping tools), systematically download or export course content, or use Platform content to develop, train, or populate a competing product, course, or curriculum. We may monitor access patterns to enforce this and may suspend accounts that exhibit automated or bulk-access behavior."

---

## Phase 5 — World Class Unlock: one-time add-on, ₦18,000, 6 months

Decision made: World Class stays out of the recurring Pro subscription entirely. It's a one-time ₦18,000 purchase, available only to active Pro subscribers, granting 6 months of access to World Class agents specifically (not a new top-level tier, not a recurring charge).

Entitlements model:

```sql
alter table public.entitlements
  add column if not exists tier text not null default 'free' check (tier in ('free','pro')),
  add column if not exists tier_expires_at timestamptz,
  add column if not exists world_class_until timestamptz;
```

- `tier` / `tier_expires_at` replace `is_pro` / `pro_expires_at` one-for-one — driven by the existing recurring Pro subscription. Migrate then drop the old columns once every call site (`usePro.js`, `create-paystack-checkout`, `paystack-webhook`, `Admin.jsx`) is updated — grep for `is_pro` and `pro_expires_at` to find them all.
- `world_class_until` is independent and stackable — it's set by the World Class Unlock purchase and extended (not overwritten) on repurchase before it expires: `world_class_until = greatest(coalesce(world_class_until, now()), now()) + interval '6 months'`.
- Live Class purchase sets **both**: `tier = 'pro'`, `tier_expires_at = now() + interval '6 months'` (this is what already grants full Beginner–Advanced access per the existing "6 months of full catalog access" copy) **and** `world_class_until = now() + interval '6 months'` (so it also covers World Class, matching what Pricing.jsx already promises). Cohort-only perks (Discord, career coaching, certificate) stay a separate flag, untouched by this content-gating logic.

`create-paystack-checkout`: add `world_class_unlock: 18000` to `PRICES`, and reject the checkout server-side with a clear error if the caller's `tier` isn't currently `pro` and unexpired — this is an add-on for existing subscribers, not a standalone entry point.

`paystack-webhook`: on a confirmed `world_class_unlock` payment, extend `world_class_until` as above via the service-role client.

`Pricing.jsx`: add a fourth card, visually distinct from a parallel subscription tier — "World Class Unlock — ₦18,000 one-time — 6 months of access to all World Class agents." Disable/lock it with an upsell prompt for anyone who isn't currently on Pro.

`get-course-content`'s gating logic already reflects this model (see the updated code above).

---

## Suggested order for Claude Code

Phase 0 → Phase 1 → Phase 4 (ToS text, cheap) → Phase 3 (admin visibility) → Phase 2 (product decision pending) → Phase 5 (pricing decision pending).
