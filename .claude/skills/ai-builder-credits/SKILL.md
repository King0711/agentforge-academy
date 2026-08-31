---
name: ai-builder-credits
description: Design decisions, cost model, and build plan for the AI Builder Credits system — the credit wallet, AI gateway Edge Function, and the Builder 1 curriculum rewrite that removes every student-side Anthropic subscription dependency. Load before touching ai_credit_*, ai_usage_logs, ai_models, the ai-gateway function, credit top-up checkout, or any course_content starter_code / session rewrite.
---

# AI Builder Credits — decisions and cost model

Agreed with the project owner across a design session (2026-08-31). Everything here is a
**settled decision** unless marked OPEN. Do not re-litigate; do not re-derive the cost model.

## The framing decision: extend, never rebuild

A "master build prompt" proposed a from-scratch SaaS on React+TS / **FastAPI / PostgreSQL /
Docker**. That was rejected. Most of it already exists and is live with paying students on
Vite+React 19 / Supabase / Paystack / Vercel.

**No FastAPI. No Docker. No new Postgres. No new hosting. No subdomain.**

Supabase already *is* the Postgres + auth + serverless layer the prompt asked for; a Deno Edge
Function plays the role of the "AI Gateway service". Map the prompt's vocabulary onto what exists:

| Prompt term | This codebase |
|---|---|
| `users` + RBAC | Supabase Auth + `entitlements.is_admin` |
| `courses` / `enrollments` / `projects` | `src/data/agents*.js` + `course_content`, gated by `builder1_expires_at` / `builder2_expires_at` |
| Admin dashboard | `src/pages/Admin.jsx` + `admin_*` RPCs in `supabase/admin-setup.sql` |
| Payment → enrollment | `create-paystack-checkout` + `paystack-webhook` (live) |
| Student dashboard | `src/pages/StudentDashboard.jsx` (nested routes) |

Genuinely missing, and the only thing being built: the **credit wallet + AI gateway**.

### Domain: stays on the current domain

`socialdevtechnologies.com/dashboard/...`, NOT `students.socialdevtechnologies.com`. Supabase Auth
sessions are stored per-origin, so a subdomain splits the login unless auth is reconfigured for a
shared cookie — real breakage on a live system, for zero benefit. A subdomain would also have cost
nothing extra on Cloudflare (DNS records are free; per-hostname billing is only Cloudflare "Custom
Hostnames" for *customers'* domains), so there was no cost argument either way.

## Architecture

```
Student's app  →  ai-gateway (Supabase Edge Function)  →  Anthropic API
                      ├─ verify Supabase JWT
                      ├─ check ai_credit_wallets balance
                      ├─ check ai_models: active? tier allowed? rate limit?
                      ├─ call Anthropic with OUR key (server-side secret only)
                      ├─ insert ai_usage_logs
                      └─ deduct credits via SECURITY DEFINER RPC (row-locked, atomic)
```

The key lives **only** in the Edge Function secret. Never in a `VITE_`-prefixed var — those are
bundled into client JS. Set by the owner, not by Claude (account creation + billing is theirs):

```
supabase secrets set ANTHROPIC_API_KEY=... --project-ref qkrfpuckvymjpewcszgs
```

## Schema (4 new tables, additive)

Follow the existing conventions in `supabase/schema.sql`: RLS on every table, `set_updated_at`
trigger, no client write policy for anything privileged.

- **`ai_credit_wallets`** — `user_id` PK, `balance int not null default 0`, `updated_at`. Select-own RLS only.
- **`ai_credit_transactions`** — `id`, `user_id`, `transaction_type` (`initial_allocation` | `purchase` | `usage` | `bonus` | `admin_adjustment` | `refund`), `credit_amount`, `balance_before`, `balance_after`, `description`, `created_at`. Select-own RLS.
- **`ai_models`** — `model_key` PK, `provider`, `display_name`, `credit_cost`, `max_tokens`, `rate_limit_per_hour`, `min_tier` (`null`|`builder1`|`builder2`), `is_active`. Readable when active (the UI needs a model picker); writes via admin RPC only.
- **`ai_usage_logs`** — `id`, `user_id`, `provider`, `model_key`, `input_tokens`, `output_tokens`, `credit_cost`, `status`, `project_slug`, `created_at`. Select-own RLS; insert only from the gateway's service-role client. Index `(user_id, created_at)` — it backs rate limiting.

New RPCs: `admin_adjust_user_credits`, `admin_set_ai_model`, `admin_get_ai_usage_summary`.

**Every one ships with all three statements** (see CLAUDE.md — the `is_admin()` guard is not
sufficient; this project's `ALTER DEFAULT PRIVILEGES` grants `anon` directly):

```sql
REVOKE EXECUTE ON FUNCTION public.<name>(<args>) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.<name>(<args>) FROM anon;
GRANT  EXECUTE ON FUNCTION public.<name>(<args>) TO authenticated;
```

## Where credits come from

Credits are **not** money students hold. They are an internal rationing unit for the owner's own
prepaid Anthropic budget, sized so AI cost stays a small fraction of course revenue.

- **Granted on entitlement activation**, not on free signup — signup requires no payment, so
  granting real AI spend to anonymous accounts is an abuse vector. Hook into `paystack-webhook`
  (where `builder*_expires_at` is set) and the `admin_set_user_builder1/2/pro` RPCs. **Not**
  `handle_new_user()`.
- **Backfill at launch is required.** Students who paid before this ships would otherwise see a
  balance of 0. One-time script granting the standard allotment to every account with an active
  `builder1_expires_at` / `builder2_expires_at` / `is_admin`. Same shape as
  `supabase/backfill-fee-flagged-payments.sql`.

## Cost model (measured 2026-08-31 — do not re-derive)

Pricing per 1M tokens: **Haiku 4.5** $1 / $5 · **Sonnet 5** $2 / $10 · **Opus 5** $5 / $25.

Measured from real `course_content`: `max_tokens` across the 11 API projects ranges 150–1,500
(avg 650; actual output ~400). Input averages ~2,200 tokens, dominated by the scrape/document
projects (#7 sends 8,000 chars, #8 sends `text[:15000]` ≈ 3,750 tokens).

| Model | Cost per average request |
|---|---|
| Haiku 4.5 | **$0.0042** |
| Sonnet 5 | **$0.0084** |
| Opus 5 | **$0.021** |

### The batch multiplier — the single biggest budget risk

**Several agents call the API once per item, not once per run.** Gmail triage (course_id 1) does
`maxResults=10` then calls `classify()` inside the loop — one "run" is 10 API calls. Same shape in
the Slack briefing, data extractor, lead qualifier, and the Builder 2 news monitor.

Realistic consumption for one student through Builder 1:
- 8 single-call projects × ~40 runs = ~320 calls
- 3 batch projects × ~20 runs × 10 items = ~600 calls
- **≈ 950 requests total**, not 500.

| Model | Full Builder 1 run | % of ₦50,000 revenue* |
|---|---|---|
| Haiku 4.5 | ~$4.00 | ~13% |
| Sonnet 5 | ~$8.00 | ~26% |
| Opus 5 | ~$20.00 | ~65% |

\* at roughly ₦1,600/$1 → ~$31. Re-check the rate; it swings this table.

**Keep the batch caps in the starter code.** The existing `maxResults=10` is correct — do not let
it become "all unread". And use prompt caching on the repeated-document projects (FAQ chatbot, doc
Q&A) where the same document is re-sent each question: cache reads bill at ~10% of input, and do
not count toward ITPM rate limits at all.

### Credit denomination

**1 credit = $0.002 of provider spend.** Deduction is computed from the token counts already
recorded in `ai_usage_logs` — never a flat per-request charge, or the batch projects distort it.

- Haiku request ≈ **2 credits** · Sonnet 5 request ≈ **4 credits** · heavy PDF on Sonnet ≈ **10 credits**
- **Included allotment: 2,000 credits** (≈$4 cost, ~13% of revenue). 500 was ~4× too low.
- **Default students to Haiku 4.5**; offer Sonnet 5 at higher credit cost. These are
  classify/summarize/extract/rewrite tasks. Opus 5 is not viable for included credits.

### No top-up in phase 1 — DECIDED, owner is cash-constrained

A fixed 2,000-credit allotment with **no top-up path** makes maximum provider cost per student
exactly **$4.00**, hard-enforced. Total exposure = $4 × student count, fully predictable. The $5 /
1,250-credit pack is designed and costed (50% margin) but **deliberately deferred** — it adds
payment-handling risk and an unbounded tail for no benefit right now. Add only if students ask.

When it is built: reuse `create-paystack-checkout` → `paystack-webhook` with a **credit-pack SKU
branch** that calls `ai_grant_credits` instead of setting `builder*_expires_at`.

## Buying the API key

There is **no bundle or subscription** — the Claude API is pay-as-you-go with prepaid credits.
Tiers (Evaluation → Start → Build → Scale → Custom) are assigned automatically from usage history
and cannot be purchased. What is actually controlled:

- **Prepaid credit balance** + **auto-reload** (set a trigger threshold and reload amount).
- **A self-imposed spend limit** below the tier cap, on Settings → Billing. Set this — it is the
  real backstop if the gateway's own metering is ever bypassed.
- Credits **expire one year** from purchase date, non-extendable. Do not over-prepay.

Start tier caps spend at $500/month and allows 1,000 RPM / 2M ITPM / 400K OTPM on Haiku 4.5 —
far beyond this platform's needs. Rate limits are not the constraint; budget is.

## Curriculum rewrite (Option B — confirmed)

The live guides currently instruct students to open **Claude Code / Claude Desktop / Cowork** and
paste prompts that generate the project files (`whatYouNeed` in course_id 7 literally says so).
That is a *second* subscription dependency on top of the runtime one.

**Decision: remove it.** Go back to real, hand-written starter code plus step-by-step instructions
explaining *why*, which students read, edit, and run in any free editor. Zero AI cost at build
time; only the finished app's runtime calls hit the gateway. This also matches the owner's own
stated philosophy — UNDERSTAND → ASSEMBLE → CONNECT → CUSTOMIZE → CHALLENGE, explicitly *not*
"ask AI to build everything".

Scope:
- All **12** Builder 1 projects need the `session` guide format changed (not just the 11 with API calls).
- **11** need `starter_code` reworked: replace `Anthropic()` + `.messages.create(...)` with a small
  shared helper POSTing to the gateway with the student's Supabase token.
- Starter code pins **`claude-sonnet-4-5`**, an outdated model ID — update as part of this pass.
- Keep the AI call in **one small function** so a student who later gets their own key changes one
  config line, not a rewrite. This is the "independent builders" promise.
- **Course_id 4** (Daily News, Make.com + free Gemini) is left alone — already free, no API billing.
- Safe to ship to everyone at once, including mid-project students: it only *removes* a requirement.

## UI impact: additive only

`DashboardSidebar.jsx` is a flat `NAV_ITEMS` array — Credits is one more entry, plus one card
beside `JumpBackInCard`. Nothing existing moves or is renamed. Admin gets
`src/pages/admin/AdminAICredits.jsx`, same nested-route pattern as `AdminUsers.jsx`.

## Guardrails — all enforced in `supabase/ai-credits-setup.sql`

The budget protections are **in Postgres, not in the Edge Function**, deliberately. A
check-then-deduct in JavaScript leaves a race that the batch projects hit routinely.

- **Kill switch** — `ai_platform_settings.gateway_enabled`, ships **FALSE**. Nothing can be spent
  until an admin turns it on. The system deploys dormant, before Anthropic is ever funded.
- **Reserve-then-settle** — `ai_reserve_request()` reserves the *worst case* (full `max_tokens` of
  output) behind `SELECT ... FOR UPDATE` on the wallet row; `ai_settle_request()` refunds the
  surplus once real token counts are known. Closes both the overshoot and the concurrency race.
- **Failed requests cost nothing** — settle with a non-success status refunds the full reservation.
- **`balance >= 0`** is a table constraint, not just application logic.
- **Rolling 24h caps** — per student (`daily_credit_cap_per_user`, default 400) and a platform-wide
  circuit breaker (`daily_credit_cap_platform`, default 5000).
- **Per-model hourly rate limit**, **server-side `max_tokens` clamp**, **model allow-list +
  tier gate**, **entitlement re-check** (same rule as `course_content`).
- **Idempotent grants** — duplicate webhook delivery cannot double-credit.
- Opus 5 is deliberately **not seeded** into `ai_models`.

### The `RETURNS TABLE` ambiguity trap bit again — verify with a probe, not review

`ai_reserve_request` returns `TABLE (log_id, credits_reserved, max_tokens)`, which puts those three
names in scope as plpgsql variables for the whole body. `ai_usage_logs.credits_reserved` collides,
and the function threw `column reference "credits_reserved" is ambiguous` *before* reaching the
wallet check. Identical failure mode to the `is_admin` bug in `admin-setup.sql`. **Alias every table
reference inside any `RETURNS TABLE` function in this project.**

It passed review and was caught only by a role-simulation probe (`set_config('role','authenticated')`
+ `request.jwt.claims`, calling the function inside a `begin/exception` block and recording
`MESSAGE_TEXT`). Run that probe against any new gating function before trusting it.

**Owner-side guardrails Claude cannot set** (account-level, must be done in the Anthropic Console):
a self-imposed monthly spend limit, the prepaid amount, and auto-reload settings. The spend limit
is the backstop if the gateway itself is ever bypassed or buggy — it must be set before the first
student request.

## Rollout order

1. Schema migration — `supabase/ai-credits-setup.sql` **and the backfill script**. *(SQL written; not yet applied to production.)*
2. `ai-gateway` Edge Function, Anthropic only — thin: authenticate, call `ai_reserve_request`, call Anthropic, call `ai_settle_request`.
3. Credit grants wired into `paystack-webhook` + admin RPC.
4. Student Credits UI.
5. Admin AI console (settings incl. the kill switch, usage, per-student adjustment).
6. Rewrite course_id 7 (Social Post Generator) end-to-end first as the template, verify, then the other 10.
7. ~~Credit top-up~~ — deferred, see above.

## OPEN

- Credit allotment for **Builder 2** and **Pro** tiers (only Builder 1 has been modelled).
- Confirm the current ₦/$ rate before locking the top-up price.
- Whether to turn off Paystack "customer bears the fee" (pre-existing item, see CLAUDE.md).
