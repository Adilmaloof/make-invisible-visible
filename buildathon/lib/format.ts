const inrFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const inr = (n: number) => inrFmt.format(Math.round(Number.isFinite(n) ? n : 0));

export const num = (n: number, digits = 0) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(Number.isFinite(n) ? n : 0);

export const compactInr = (n: number) =>
  '₹' + new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

export function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' }) + " '" + String(y).slice(2);
}

export function bucketLabel(key: string) {
  return key.includes('-W') ? key.split('-')[1] : monthLabel(key);
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Small, stable string hash (djb2) — used for fingerprints and ids. */
export function hashString(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Runs a task but guarantees a minimum duration — lets loaders mask processing gracefully. */
export async function withMinDuration<T>(task: () => Promise<T> | T, minMs: number): Promise<T> {
  const [result] = await Promise.all([Promise.resolve().then(task), sleep(minMs)]);
  return result;
}
