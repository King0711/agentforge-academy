// Date helpers for /admin/analytics. Everything is a 'YYYY-MM-DD' string in
// Africa/Lagos calendar days (the same days the SQL buckets use), and all the
// arithmetic is done in UTC so the browser's own time zone never shifts a day.
const DAY_MS = 24 * 60 * 60 * 1000;

export const BUCKETS = ['day', 'week', 'month', 'year'];

const toMs = (iso) => Date.parse(`${iso}T00:00:00Z`);
const toIso = (ms) => new Date(ms).toISOString().slice(0, 10);

// Today in Lagos, as the dashboard's idea of "today".
export function todayLagos() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date());
}

export const addDays = (iso, n) => toIso(toMs(iso) + n * DAY_MS);
export const daysBetween = (from, to) => Math.round((toMs(to) - toMs(from)) / DAY_MS) + 1;

// First day of the bucket that contains `iso` (weeks start on Monday, like Postgres).
export function bucketStart(iso, bucket) {
  const d = new Date(toMs(iso));
  if (bucket === 'week') return toIso(toMs(iso) - ((d.getUTCDay() + 6) % 7) * DAY_MS);
  if (bucket === 'month') return `${iso.slice(0, 7)}-01`;
  if (bucket === 'year') return `${iso.slice(0, 4)}-01-01`;
  return iso;
}

function nextBucket(iso, bucket) {
  if (bucket === 'week') return addDays(iso, 7);
  if (bucket === 'day') return addDays(iso, 1);
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  if (bucket === 'month') return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
  return `${y + 1}-01-01`;
}

// Every bucket start between from and to, so days with no sales still show as zero.
export function bucketKeys(from, to, bucket) {
  const keys = [];
  for (let k = bucketStart(from, bucket); k <= to; k = nextBucket(k, bucket)) keys.push(k);
  return keys;
}

// A sensible default grain for how long the chosen range is.
export function autoBucket(from, to) {
  const days = daysBetween(from, to);
  if (days <= 45) return 'day';
  if (days <= 180) return 'week';
  if (days <= 1100) return 'month';
  return 'year';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function bucketLabel(key, bucket, { long = false } = {}) {
  const y = key.slice(0, 4);
  const m = MONTHS[Number(key.slice(5, 7)) - 1];
  const d = Number(key.slice(8, 10));
  if (bucket === 'year') return y;
  if (bucket === 'month') return long ? `${m} ${y}` : `${m} ${y.slice(2)}`;
  if (bucket === 'week') return long ? `Week of ${d} ${m} ${y}` : `${d} ${m}`;
  return long ? `${d} ${m} ${y}` : `${d} ${m}`;
}

export function presetRange(preset, today, allFrom) {
  if (preset === '7d') return { from: addDays(today, -6), to: today };
  if (preset === '30d') return { from: addDays(today, -29), to: today };
  if (preset === '90d') return { from: addDays(today, -89), to: today };
  if (preset === '12m') return { from: addDays(today, -364), to: today };
  if (preset === 'ytd') return { from: `${today.slice(0, 4)}-01-01`, to: today };
  return { from: allFrom || addDays(today, -364), to: today };
}
