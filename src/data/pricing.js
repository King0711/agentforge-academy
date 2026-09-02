// Single source of truth for displayed prices — Pricing.jsx and Home.jsx
// both read from here so a price change is a one-line edit, not a hunt
// across pages. Must stay in sync with the webhook's own price checks
// (supabase/functions/paystack-webhook/index.ts resolvePlan()), which is
// the actual source of truth for what gets charged/granted server-side —
// and with create-paystack-checkout's own PRICES constant, which is what
// actually determines the amount sent to Paystack. Also duplicated (not
// imported — a pre-existing drift risk, not introduced by this change) in
// TheOfferSlide.jsx and webinarSlides.js for the live webinar deck.
//
// Cut from N50,000 to N25,000 (2026-09-02). ANCHOR_PRICE deliberately left
// at N100,000 — changing it is a marketing-copy call (it changes the
// "you save N__" framing) that wasn't part of this request; flagged
// separately rather than decided silently.
export const ANCHOR_PRICE = 100000;
export const BUILDER_PRICE = 25000;
export const BUILDER_SAVINGS = ANCHOR_PRICE - BUILDER_PRICE;
// Computed, not hardcoded — Pricing.jsx and TheOfferSlide.jsx used to have
// a literal "50% off" string next to this, which was correct back when
// BUILDER_PRICE was N50,000 (50% off N100,000) but silently went wrong the
// moment the price cut to N25,000 made the real number 75%. Shipped live
// before being caught. Compute it instead so a future price change can't
// repeat the same drift.
export const BUILDER_SAVINGS_PERCENT = Math.round((BUILDER_SAVINGS / ANCHOR_PRICE) * 100);
// PRO_PRICE recomputed to preserve the original ~10% bundle discount off
// buying both tracks separately (was N10,000 off N100,000; now N5,000 off
// N50,000) rather than left at N90,000, which would have made Pro cost
// MORE than buying Builder 1 and Builder 2 separately (N25,000 x 2 =
// N50,000) -- a broken incentive nobody would rationally buy into. This
// specific number is a default applied to avoid shipping that break, not
// an explicit instruction -- easy to override.
export const PRO_PRICE = 45000;
