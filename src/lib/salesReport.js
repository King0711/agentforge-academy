// Helpers for the admin sales report (/admin/sales, src/pages/admin/AdminSales.jsx).
// Rows come from the admin_get_sales_report RPC (supabase/admin-sales-report.sql).
import {
  BUILDER1_PRICE, BUILDER2_PRICE, PRO_PRICE, PRO_UPGRADE_FROM_BUILDER1, PRO_UPGRADE_FROM_BUILDER2,
  VIBECODING_PRICE, AI_AGENT_MASTERY_PRICE,
} from '../data/pricing';

export const PRODUCT_LABELS = {
  builder1: 'Builder 1',
  builder2: 'Builder 2',
  pro: 'Pro',
  proupgrade: 'Pro upgrade',
  vibecoding: 'AI-Assisted Coding',
  aimastery: 'AI Agent Mastery',
  agentslive: 'AI Agents Live',
  live_class: 'Live class',
};

export const productLabel = (product) => PRODUCT_LABELS[product] || product || 'No product';

// The webhook writes 'granted' for a payment that unlocked a product, and
// 'granted_<reason>' when it was granted after a fix (fee backfill, manual).
// Everything else ('flagged_*') did not unlock anything and isn't a sale.
export const isSale = (row) => String(row.status ?? '').startsWith('granted');

// Checkout passes Paystack's fee on to the buyer, so the amount charged is
// (price + ₦100) / (1 - rate), with 1.5% for Nigerian cards (fee capped at
// ₦2,000) and 3.9% for international ones. Working that back gives the price,
// and the difference is the fee. Prices we have charged are tried first; a
// whole-naira result is the fallback for a price not in the list.
// This is an estimate: Paystack's own settlement export is the exact figure.
const KNOWN_PRICES = [
  BUILDER1_PRICE, BUILDER2_PRICE, PRO_PRICE, PRO_UPGRADE_FROM_BUILDER1, PRO_UPGRADE_FROM_BUILDER2,
  VIBECODING_PRICE, AI_AGENT_MASTERY_PRICE,
  10000, // scholarship and discount-code price for AI Agent Mastery
  15000, 25000, 45000, 100000, // older prices still in this year's payments
];
const FEE_RULES = [
  { label: 'Nigerian card', charge: (p) => Math.min((p + 100) / 0.985, p + 2000) },
  { label: 'International card', charge: (p) => (p + 100) / 0.961 },
];
const near = (a, b) => Math.abs(a - b) < 0.02;
const round2 = (n) => Math.round(n * 100) / 100;

export function estimateFee(amount) {
  const charged = Number(amount);
  if (!Number.isFinite(charged)) return { fee: 0, basis: 'Unknown amount' };
  if (KNOWN_PRICES.some((p) => near(charged, p))) return { fee: 0, basis: 'No fee added' };
  for (const rule of FEE_RULES) {
    const price = KNOWN_PRICES.find((p) => near(round2(rule.charge(p)), charged));
    if (price) return { fee: round2(charged - price), basis: rule.label };
  }
  // A price not in the list: accept it only if working back lands on whole naira.
  for (const rule of FEE_RULES) {
    const price = rule.label === 'Nigerian card' ? charged * 0.985 - 100 : charged * 0.961 - 100;
    const whole = Math.round(price);
    if (whole > 0 && near(round2(rule.charge(whole)), charged)) return { fee: round2(charged - whole), basis: rule.label };
  }
  return { fee: 0, basis: 'Could not tell; fee not included' };
}

// Africa/Lagos has no daylight saving, so WAT is always UTC+1.
const WAT_OFFSET_MS = 60 * 60 * 1000;
const watParts = (iso) => new Date(new Date(iso).getTime() + WAT_OFFSET_MS).toISOString();
export const watDateTime = (iso) => watParts(iso).slice(0, 16).replace('T', ' ');
export const watMonth = (iso) => watParts(iso).slice(0, 7);
export const watToday = () => watParts(new Date().toISOString()).slice(0, 10);

// "2026-01-01" (a WAT calendar date) → the UTC instant that day starts.
export const watDayStartIso = (ymd) => new Date(`${ymd}T00:00:00+01:00`).toISOString();
export const watDayAfterIso = (ymd) => new Date(new Date(`${ymd}T00:00:00+01:00`).getTime() + 86400000).toISOString();

export function enrich(rows) {
  return rows.map((r) => {
    const sale = isSale(r);
    const { fee, basis } = sale ? estimateFee(r.amount) : { fee: 0, basis: 'Not a sale' };
    const amount = Number(r.amount) || 0;
    return { ...r, amount, sale, fee, feeBasis: basis, kept: round2(amount - fee), label: productLabel(r.product) };
  });
}

function group(rows, keyOf) {
  const map = new Map();
  for (const r of rows) {
    if (!r.sale) continue;
    const key = keyOf(r);
    const g = map.get(key) ?? { key, count: 0, charged: 0, fees: 0, kept: 0, commission: 0 };
    g.count += 1;
    g.charged += r.amount;
    g.fees += r.fee;
    g.kept += r.kept;
    g.commission += Number(r.referral_commission) || 0;
    map.set(key, g);
  }
  return [...map.values()];
}

export function summarize(rows) {
  const [total] = group(rows, () => 'all');
  return {
    total: total ?? { count: 0, charged: 0, fees: 0, kept: 0, commission: 0 },
    byProduct: group(rows, (r) => r.label).sort((a, b) => b.kept - a.kept),
    byMonth: group(rows, (r) => watMonth(r.created_at)).sort((a, b) => a.key.localeCompare(b.key)),
  };
}

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
// Names come from sign-up forms: a leading = + - @ would run as a formula in Excel.
const csvText = (value) => {
  const text = String(value ?? '');
  return csvCell(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text);
};
const money = (n) => csvCell((Math.round(n * 100) / 100).toFixed(2));

// full = false drops everything that identifies a buyer: name, email and the
// Paystack reference (it embeds the buyer's account id). What is left is the
// money, the product and the date, so it can go to an accountant or investor.
export function salesCsv(rows, { full = true } = {}) {
  const header = [
    'Date (WAT)', 'Month', 'Product', 'Charged to customer (NGN)', 'Paystack fee, estimated (NGN)',
    'Kept after fee (NGN)', 'Counted as a sale', 'Fee basis', 'Referral commission (NGN)', 'Payment status',
    'Currency',
    ...(full ? ['Buyer name', 'Buyer email', 'Paystack reference'] : ['Sale no.']),
  ];
  let saleNo = 0;
  const lines = rows.map((r) => {
    const cells = [
      csvCell(watDateTime(r.created_at)), csvCell(watMonth(r.created_at)), csvCell(r.label), money(r.amount),
      money(r.fee), money(r.kept), csvCell(r.sale ? 'Yes' : 'No'), csvCell(r.feeBasis),
      money(Number(r.referral_commission) || 0), csvCell(r.status), csvCell(r.currency),
    ];
    if (full) {
      cells.push(
        csvText(r.buyer_name ?? (r.buyer_email ? '' : '(no account)')), csvText(r.buyer_email), csvText(r.reference),
      );
    } else {
      cells.push(csvCell(r.sale ? (saleNo += 1) : ''));
    }
    return cells.join(',');
  });
  // The BOM makes Excel read the file as UTF-8.
  return '﻿' + [header.map(csvCell).join(','), ...lines].join('\r\n');
}
