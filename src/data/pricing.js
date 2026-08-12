// Single source of truth for displayed prices — Pricing.jsx and Home.jsx
// both read from here so a price change is a one-line edit, not a hunt
// across pages. Must stay in sync with the webhook's own price checks
// (supabase/functions/paystack-webhook/index.ts resolvePlan()), which is
// the actual source of truth for what gets charged/granted server-side.
export const ANCHOR_PRICE = 100000;
export const BUILDER_PRICE = 50000;
export const BUILDER_SAVINGS = ANCHOR_PRICE - BUILDER_PRICE;
export const PRO_PRICE = 90000;
