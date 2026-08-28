# Agent Forge / Social Dev Technologies — Project Context

React 19 + Vite frontend, Supabase (Postgres + Auth + Edge Functions, Deno) backend, Paystack payments, deployed on Vercel (GitHub `master` branch = production — there is no `main` branch; check with `git ls-remote --heads origin` before assuming).

**Deploy pipeline ownership:** the GitHub repo is `King0711/agentforge-academy`, and the Vercel project that serves `socialdevtechnologies.com` lives in a *separate person's* Vercel account (team `AGENTFROGE`, Hobby plan). Anything that requires installing/authorizing the Vercel GitHub App, or reconnecting the Git integration, has to be done by the repo owner — collaborator access is not sufficient, since GitHub App installation is an ownership-level permission. If merges stop deploying, check the project's Settings → Git (repo still connected?) and Settings → Environments → Production (Branch Tracking still `master`?) before assuming the build is broken. Note that Vercel does *not* retroactively build commits that landed before a Git reconnection — it needs a fresh push.

Supabase project ref: `qkrfpuckvymjpewcszgs`. Two other webhook functions exist (`flutterwave-webhook`, `lemonsqueezy-webhook`) but Paystack is the live payment provider.

## Access model

`entitlements` table (RLS: no client write, service-role/Edge-Function/admin-RPC only):
- `builder1_expires_at` / `builder2_expires_at` — per-tier, one-time ₦50,000 payment, 6 months access each. `pro` plan (₦90,000) grants both at once.
- `is_admin` — bypasses all gating.
- `is_pro` / `pro_expires_at` — legacy columns, no longer read or written anywhere, kept for historical data only.

`course_content` RLS policy checks `builder1_expires_at`/`builder2_expires_at` directly against `now()`, or `is_admin`.

Admin panel (`/admin`, `src/pages/Admin.jsx`) uses SECURITY DEFINER RPCs in `supabase/admin-setup.sql` (`admin_get_all_profiles`, `admin_set_user_pro`, `admin_set_user_admin`) — self-check inside each function, only callable by an existing admin.

**Every new `admin_*` RPC needs three revokes, not one.** The internal `is_admin()` guard is necessary but isn't the whole job — two separate default-grant mechanisms make a fresh function reachable anonymously over `/rest/v1/rpc/<name>` unless both are revoked:
1. Postgres grants `EXECUTE` to `PUBLIC` by default on `CREATE FUNCTION`, and `anon`/`authenticated` inherit from `PUBLIC`.
2. This Supabase project's `ALTER DEFAULT PRIVILEGES` on the `public` schema *also* grants `EXECUTE` directly to `anon` (and `authenticated`), independent of `PUBLIC` — confirmed 2026-08-19 when `admin_update_testimonial` came out of `CREATE FUNCTION` with `anon` already in its ACL despite no explicit grant statement. Revoking only `FROM PUBLIC` leaves this direct grant untouched.

Ship every admin RPC with all three statements:

```sql
REVOKE EXECUTE ON FUNCTION public.<name>(<arg types>) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.<name>(<arg types>) FROM anon;
GRANT  EXECUTE ON FUNCTION public.<name>(<arg types>) TO authenticated;
```

A correctly-locked function's ACL reads `postgres=X, authenticated=X, service_role=X` with no leading `=X/postgres` entry (that empty grantee is `PUBLIC`) and no `anon` entry — check by querying `aclexplode(proacl)`, not just by eyeballing `REVOKE ... FROM PUBLIC` in the migration. The guides-CMS and live-session RPCs shipped without any of this and were anonymously callable until 2026-08-19; the `is_admin()` guard did hold, so nothing was exposed, but they were relying on a single layer. Check with `get_advisors(type: "security")`.

`get_certificate_by_id` is deliberately left callable by `anon` — the public `/verify/:id` page depends on it.

## Recent incident — resolved 2026-08-05

**Bug:** `paystack-webhook` (`supabase/functions/paystack-webhook/index.ts`) required the charged amount to match the listed plan price within ±₦1. When a customer's card is charged with Paystack's transaction fee passed through (Paystack Dashboard → Settings → Preferences → "Transaction fees" toggle), the actual `charge.success` amount is price + fee, so `resolvePlan()` returned `null` and the payment got logged to `payments` as `flagged_unrecognized_amount` (with `user_id: null`) instead of granting the entitlement. Real, successful payments were silently not granting access — affected at least one confirmed user (`ezinwajohn@gmail.com`, Builder 1, charged ₦50,862.95 against a ₦50,000 price).

**Fix applied (local edit, not yet redeployed):**
- `resolvePlan()` now accepts amounts from the listed price up to `price * 1.06` (`FEE_CEILING_MULTIPLIER`), covering Paystack's local (~1.7%) and international (~4%) fee ranges with headroom, instead of requiring an exact match.
- `supabase/backfill-fee-flagged-payments.sql` — idempotent backfill script. Parses plan + user id back out of `provider_transaction_id` (format: `sdt_<plan>_<uuid>_<timestamp>`, set at checkout time), sanity-checks the amount against the same price/fee band, grants the entitlement, and relabels the payment row `granted_backfill_fee_mismatch`. Rows it can't confidently resolve are left `flagged_unrecognized_amount` for manual review (e.g. a ₦100 charge with no plan/user in its reference turned up during backfill — unrelated to any real plan, likely a card-verification probe, correctly left alone).
- Already run once against production data; `ezinwajohn@gmail.com` is fixed.

**Still open / TODO:**
- [x] ~~Redeploy `paystack-webhook`~~ — done. The deployed function is at version 16 and contains `FEE_CEILING_MULTIPLIER = 1.06`; verified 2026-08-19 by reading it back with the Supabase MCP. This entry sat here stale for a while and read like an active revenue-losing bug, so check the deployed version before trusting a TODO here.
- [ ] Decide whether to also turn off "customer bears the fee" in Paystack Dashboard → Settings → Preferences (optional now that the webhook tolerates it, but affects what customers see at checkout).
- [ ] Re-run `backfill-fee-flagged-payments.sql` periodically or after the redeploy to confirm no new flagged rows accumulate.

## Article and guide images

Header images for news articles and guides live in the **`news-images` Supabase Storage bucket** (public), but `image_url` on a row stores a **first-party URL**, never the raw storage one:

```
https://socialdevtechnologies.com/article-images/<slug>-<timestamp36>.jpg
```

`vercel.json` rewrites `/article-images/*` onto the bucket's public endpoint — so images are attributed to the site rather than a `supabase.co` host, and changing storage later is a rewrite change instead of a rewrite of every `image_url` in the database. The rewrite must stay **above** the catch-all `/(.*)  → /index.html`, or it never matches. `src/lib/articleImages.js` owns the path/URL construction; keep it and the rewrite in step.

**Use 1200×675 (16:9).** Every on-site placement renders the image in a 16:9 `object-cover` box — both listing cards (`News.jsx`, `GuidesIndex.jsx`) and both article heroes (`NewsArticle.jsx`, `GuidePage.jsx`) — so 1200×675 fits all four exactly, while still clearing LinkedIn's 1200×627 floor for the `og:image` (which crops to ~1.91:1 and loses only a couple dozen pixels). The admin upload control warns on off-ratio images but never blocks them.

**Uploads use a unique path per upload, not a stable `<slug>.jpg`.** These are served with a one-year immutable `Cache-Control`, so overwriting a path would strand viewers on the old image until the CDN entry expired. The tradeoff is that replaced images become unreferenced orphans in the bucket — prune them from the Supabase dashboard, not with `delete from storage.objects` (a direct row delete unlinks the index entry but leaves the actual blob behind).

**Storage policies are a separate layer from the `admin_*` RPC grants above.** The bucket existed with *zero* RLS policies until 2026-08-22 and nobody noticed, because `generate-news-digest` writes through `service_role`, which bypasses RLS entirely — so the gap only surfaced when a browser first tried to upload. Anything that writes to a bucket from the client needs explicit policies; `supabase/article-images-setup.sql` holds the three admin-gated ones (insert/update/delete) plus the bucket's `file_size_limit` (2MB) and `allowed_mime_types` (JPG/PNG/WebP). Those two bucket settings were also null until then — harmless while only `service_role` could write, dangerous the moment a browser can.

Note the policies read the caller's `entitlements` row, which works only because that table's RLS permits `auth.uid() = user_id` self-reads. Tightening `entitlements` RLS would silently break admin uploads — verify with a role-simulation probe (`set local role authenticated` + `request.jwt.claims`), not by eyeballing the policy.

**Automatic generation exists but has never run.** `generateImage()` in `supabase/functions/generate-news-digest/index.ts` calls OpenAI `gpt-image-1` when `OPENAI_API_KEY` is set, and returns `null` (logging a warning) when it isn't — which is why the bucket sat empty for weeks. Two things to know before switching it on: `gpt-image-1` is **deprecated as of 2026-10-23**, and the hardcoded `1536x1024` is 1.5:1, not the ~1.91:1 the code comment claims to be aiming for. Gemini's free tier (~500 images/day, native 16:9) was evaluated as the better replacement if per-article art is ever wanted.

## Workflow preferences (confirmed with project owner)

- **Git:** push to a feature branch and open a PR — do not push straight to `main`. This repo has live payment/auth logic; changes should go through a review step before production.
- **Supabase Edge Functions:** deploy via the Supabase CLI once linked (`supabase link --project-ref qkrfpuckvymjpewcszgs`).
- Broader engineering conventions (schema style, RLS patterns, watermarking approach for paid content, etc.) are documented in `content-protection-brief.md` and `claude-code-prompt.md` in the repo root — read those before touching payment, entitlement, or content-gating code.
