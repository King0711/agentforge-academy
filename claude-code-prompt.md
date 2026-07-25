## Paste the block below into Claude Code

---

You're working in the Social Dev Technologies / Agent Forge repo (React 19 + Vite frontend, Supabase Postgres/Auth/Edge Functions backend, Paystack payments, deployed on Vercel).

Context: this product has zero live users yet — it's pre-launch. That means every change below is a clean build, not a migration: no backward compatibility, no grandfathering, no user-facing risk from breaking changes. Build it right the first time.

Read `content-protection-brief.md` in the repo root first — it has the full reasoning and SQL/TypeScript code for Phases 0 through 5, including the finalized World Class pricing model below. Implement Phase 5 now, folded into the same schema work as Phase 0 — it's no longer conditional.

Work in plan mode. Propose your full implementation plan before writing any code, and wait for my go-ahead. Once implementation is done, stop — do not deploy, push to main, or publish anything. Hand it back to me for review; I'll trigger the publish myself.

### What to build, in order

**1. Schema — combine Phase 0 and Phase 5 from the brief.** Since there's no live data, replace `entitlements.is_pro` / `pro_expires_at` outright rather than adding parallel columns:

- `tier text not null default 'free' check (tier in ('free','pro'))` — driven purely by the existing recurring Pro subscription.
- `tier_expires_at timestamptz` (nullable; `tier='free'` with a null expiry means free forever).
- `world_class_until timestamptz` (nullable) — an independent, stackable grant. Set by the one-time World Class Unlock purchase (extend on repurchase, don't overwrite: `greatest(coalesce(world_class_until, now()), now()) + interval '6 months'`) and also set by a Live Class purchase (which grants both this and `tier='pro'`/`tier_expires_at` for 6 months — Live Class already promises full catalog access).
- keep `is_admin` as-is (bypasses everything).
- Content gating rule: Beginner/Intermediate/Advanced require `tier = 'pro'` (unexpired) or `is_admin`. World Class requires `world_class_until` in the future or `is_admin` — independent of `tier`.
- Add `difficulty text not null` to `course_content` (values matching `agents*.js`: Beginner/Intermediate/Advanced/World Class) so the Edge Function in step 3 can decide gating from the row itself rather than trusting client input.
- Version-control `course_content`'s table definition and RLS policy in `schema.sql` — it currently only exists in the live Supabase project; pull it from there and add it in the same style as `profiles`/`entitlements`/`progress`/`payments`.
- Grep the whole repo for `is_pro` and `pro_expires_at` and update every call site to the new model — `usePro.js`, `paystack-webhook`, `create-paystack-checkout`, `Admin.jsx`. Don't leave any code path still branching on the old fields.

**2. Pricing restructure.** Update `Pricing.jsx`:

- **Free** — unchanged, 12 Beginner agents.
- **Pro** — ₦15,000/mo — Beginner + Intermediate + Advanced (32 of 44 agents). Unchanged, recurring, since it's ongoing library access.
- **World Class Unlock** — ₦18,000 one-time, grants 6 months of access to all World Class agents. This is an add-on, not a parallel subscription tier — display it as such (visually distinct from the Free/Pro/Live cards), and only purchasable by users whose `tier` is currently `pro` and unexpired. Show a locked/upsell state ("Requires an active Pro subscription") for anyone else.
- **Live Class** — ₦100,000 one-time, unchanged — on purchase, grant `tier = 'pro'` with `tier_expires_at` = purchase date + 6 months **and** `world_class_until` = purchase date + 6 months (together this matches the existing "6 months of full catalog access" promise), plus a separate `live_cohort_active boolean` for the cohort-only perks (Discord, career coaching, certificate track) that aren't content-gating related.
- Update `create-paystack-checkout`: add `world_class_unlock: 18000` to `PRICES`, and reject the checkout server-side with a clear error if the caller isn't currently an active Pro subscriber — this is an upsell for existing subscribers, not a standalone entry point.
- Update `paystack-webhook`: on a confirmed `world_class_unlock` payment, extend `world_class_until` via the service-role client as described above. On `live_class`, set both `tier`/`tier_expires_at` and `world_class_until`.

**3. Anti-scraping hardening — Phase 1 from the brief.** Build the `get-course-content` Edge Function, the `content_access_log` table, and the watermarking function exactly as specified there — the gating logic already accounts for the `difficulty`/`world_class_until` split. Update `useCourseContent.js` to call this function instead of querying `course_content` directly from the browser.

**4. Catalog metadata split — Phase 2 from the brief, decision made, implement it.** Split each `agents*.js` file's exports into a public teaser shape (id, title, emoji, difficulty, one-line description) that stays in the client bundle for marketing/SEO, and a full-metadata shape (tech stack, prerequisites, buildTime, tags, full description) served only to logged-in users via a new `get-catalog` Edge Function, same pattern as `get-course-content`.

**5. Admin visibility — Phase 3 from the brief.** Add the `content_access_log` / flagged-account panel to `Admin.jsx`, and update the existing admin user-management UI to set/change `tier` and `tier_expires_at` instead of `is_pro`.

**6. ToS update — Phase 4 from the brief.** Add the anti-scraping / anti-derivative-product clause to `Legal.jsx` section 5, using the draft language in the brief. Present it clearly as a draft needing attorney review, not final legal copy.

### Before you start

Confirm you've read `content-protection-brief.md`, then give me your file-by-file implementation plan in the order above before writing any code. I'll approve or adjust it, then you build. When it's done, stop short of publishing — I'll review and push live myself.
