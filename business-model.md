# Business Model — Social Dev Technologies

Last updated: 2026-09-08

## Two arms

The business now runs two distinct arms, with different pricing, tooling assumptions, and delivery formats. They are not competing tiers of one ladder — no need for price parity or a shared AI-tool policy between them.

1. **Automation classes** (below, "AI Builder Academy") — self-paced, project-based AI agent builds. Students bring their own free Gemini API key; no paid AI subscription required.
2. **Vibe Coding classes** — a live, cohort-taught bootcamp teaching general AI-assisted web development (not agent-building). ₦25,000 one-time, 4 weeks, 8 live classes, 6 months access. No specific paid AI subscription is required or promoted — same no-paid-tool-dependency posture as the automation arm.

## Automation classes ("AI Builder Academy")

### Context

- 4-person founding team, currently unpaid.
- 23 project-based builds: 10 "Builder 1" (foundational, single-build — e.g. Gmail triage, WhatsApp bot) and 13 "Builder 2" (multi-step, guarded, portfolio-grade — e.g. invoice processing, financial reporting).
- Content is text-based (step-by-step instruction → code to paste → verify → troubleshooting), not video. Near-zero marginal cost to serve once written.
- **AI runs on students' own free Gemini API key only** — no AI Builder credits / Claude API path for now. This removes AI compute cost from the business entirely.
- Target market: African professionals building practical AI skills for their existing jobs (SME ops, admin, sales, recruiting, bookkeeping), where data costs and currency are real constraints.

### Pricing ladder

| # | Plan | Price | What's included |
|---|---|---|---|
| — | Single build (a la carte) | ₦5,000 | 1 build, self-paced, lifetime access |
| 1 | Builder 1 bundle | ₦10,000 | All 10 foundational builds |
| 2 | Builder 2 bundle | ₦10,000 | All 13 advanced builds |
| 3 | Pro bundle | ₦15,000 | All 23 builds, self-paced (both tiers) |
| 4 | Live cohort | ₦50,000 | All 23 builds + live weekly sessions + WhatsApp community + certificate |

### Pricing logic

- **A la carte (₦5,000) vs. bundle (₦10,000):** breakeven at 2 builds. Buy 1, a la carte is cheaper; buy 2+, the bundle is the obvious move. Same ratio holds for both tiers regardless of their different total build counts (10 vs. 13), since breakeven only depends on bundle price ÷ unit price. (Raised from ₦2,000 → ₦5,000; breakeven moved from 5 builds to 2, a much more aggressive nudge toward the bundle.)
- **Pro bundle (₦15,000)** is a 25% discount versus buying both tier bundles separately (₦20,000) — strong enough to make "just get Pro" the default choice for anyone leaning toward wanting both tiers.
- **Live cohort (₦50,000)** is a 2.5x premium over Pro — this is intentional. Every self-paced tier costs the team nothing ongoing once published; the cohort is the only tier that consumes founders' actual (currently unpaid) time, so it needs to be priced to reflect that, not just to sit slightly above the self-paced ceiling.

### Cost structure

- **Content:** sunk cost, already written. Near-zero to maintain (text edits only, no video re-recording).
- **AI:** ₦0 marginal cost — students bring their own free Gemini key. No credit-provisioning or credit-abuse risk to manage.
- **Hosting/infra:** Supabase + Vercel, already in place. Near-zero incremental cost per student.
- **Payment processing:** Paystack fees (~1.5%).
- **People:** 4 unpaid founders. Self-paced tiers cost the team nothing ongoing once live. The live cohort is the only tier that costs founders real time.

### Rollout sequence

1. **Launch self-paced first** (a la carte + both bundles + Pro). Zero ongoing time cost; validates willingness to pay before committing founder hours to live teaching.
2. **Run 1–2 discounted beta cohorts** once self-paced has some traction. Primary goal: generate testimonials and case studies (current testimonial pool is thin — most existing approved reviews aren't about the AI course specifically), not profit.
3. **Hold cohort price at ₦50,000 as the standing price**, or explicitly discount the first beta cohort below it if the goal is testimonials over margin — decide which before publishing pricing.

### Open questions / assumptions to pressure-test

- Is ₦10,000 per bundle validated against real willingness-to-pay in target markets, or is it inherited from an earlier discounting decision?
- Should Builder 2 (more advanced, more directly "job-ready") be priced above Builder 1 rather than at parity?
- Text-only content with no video — neutral for conversion, or does the *perception* of a "real course" need at least a trailer/testimonial video even if lessons stay text-only?
- Pricing is Naira-anchored — how should it convert for other African currencies (Kenya, Ghana, etc.)? Flat USD equivalent, or PPP-adjusted per country?
- Capacity: with 4 unpaid founders, how many concurrent cohort students can actually be supported live before quality drops or founders burn out?

## Vibe Coding classes

### Context

- Live, instructor-led bootcamp — general AI-assisted web development (portfolio site → to-do app → expense tracker → Supabase-backed CRUD app → AI-powered app → own capstone product), not agent-building. Beginner-friendly; no prior coding experience required.
- 4 weeks, 8 live classes (2/week, 2–2.5 hours each), 6 months access to recordings.
- No specific paid AI tool is required or marketed (dropped 2026-09-08 — the bootcamp no longer names or requires a particular subscription).
- Class content is **not** pre-published as written pages on the site — it's delivered live and via replays through the existing `live_sessions` table/dashboard (same mechanism the automation arm's live cohort already uses), gated to paying Vibe Coding students only. The only Vibe-Coding-specific content on the site is the prompt library (8 reusable prompts), which is standalone reference material independent of any one class.

### Pricing

| Plan | Price | What's included |
|---|---|---|
| Launch cohort | ₦25,000 | 8 live classes, 4 weeks, 6 months access, recordings, prompt library, capstone project, certificate of completion |

This is **not** a tier of the automation ladder above — it doesn't need price parity with the ₦50,000 automation live-cohort row. The two products serve different depths (broad web-dev fundamentals vs. agent-building) and different formats (cohort-taught vs. self-paced-plus-optional-cohort), so they're priced and resourced independently.

### Open questions / assumptions to pressure-test

- Same founder-capacity constraint as the automation live cohort applies here too — running both live products concurrently multiplies the time cost on 4 unpaid founders.
- Beta-cohort discounting logic (testimonials over margin, per the automation rollout sequence) likely applies here as well, since this arm also currently has zero on-topic testimonials.
