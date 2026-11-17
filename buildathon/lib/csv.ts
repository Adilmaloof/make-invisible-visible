import Papa from 'papaparse';
import type { Txn } from './types';
import { hashString } from './format';

const INCOME_RX = /\b(salary|refund|cashback|reversal|credited|interest credit|dividend)\b/i;
const CREDIT_TYPE_RX = /^(cr|credit|income|deposit)$/i;

/** Turn a noisy bank narration into a stable merchant name. */
export function normalizeMerchant(desc: string): string {
  const s = desc
    .toLowerCase()
    .replace(/\.(com|in|co|net|org|io)\b/g, ' ')
    .replace(/@[\w.-]+/g, ' ')
    .replace(
      /\b(upi|neft|imps|rtgs|pos|ach|nach|txn|ref|payment|purchase|subscription|membership|india|pvt|ltd|trip|online|ecom|debit|card|to|via|paid|the)\b/g,
      ' ',
    )
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = s.split(' ').filter((w) => w.length > 1).slice(0, 2);
  const name = words.join(' ') || 'Unknown';
  return name.replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseAmount(raw: unknown): number {
  if (raw === null || raw === undefined) return NaN;
  const s = String(raw).trim();
  if (!s) return NaN;
  const negative = /^\(.*\)$/.test(s) || s.includes('-');
  const n = parseFloat(s.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n)) return NaN;
  return negative ? -n : n;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Accepts yyyy-mm-dd, dd/mm/yyyy, dd-mm-yyyy, dd.mm.yy and anything Date can parse. Prefers day-first (IN locale). */
export function parseDate(raw: string): string | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (m) {
    let d = +m[1];
    let mo = +m[2];
    let y = +m[3];
    if (y < 100) y += 2000;
    if (mo > 12 && d <= 12) [d, mo] = [mo, d];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return `${y}-${pad(mo)}-${pad(d)}`;
  }
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  const dt = new Date(t);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export class CsvError extends Error {}

const MAX_ROWS = 5000;

export function parseExpenseCsv(text: string): Txn[] {
  if (!text || !text.trim()) throw new CsvError('The file appears to be empty.');

  const res = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const rows = res.data;
  if (!rows.length) throw new CsvError('No rows found in this CSV.');

  const headers = res.meta.fields ?? Object.keys(rows[0]);
  const find = (cands: string[], exclude: string[] = []) =>
    headers.find((h) => cands.some((c) => h.includes(c)) && !exclude.some((e) => h.includes(e)));

  const dateKey = find(['date', 'time', 'posted']);
  const descKey = find(['description', 'narration', 'merchant', 'details', 'particular', 'payee', 'remarks', 'name', 'memo']);
  const debitKey = find(['debit', 'withdrawal', 'spent', 'outflow']);
  const amountKey = debitKey ?? find(['amount', 'value', 'inr', 'total'], ['balance']);
  const catKey = find(['category', 'tag', 'group']);
  const typeKey = find(['type', 'dr/cr', 'cr/dr'], ['category']);

  if (!dateKey || !amountKey) {
    throw new CsvError('I need at least a "date" and an "amount" (or "debit") column.');
  }

  const out: Txn[] = [];
  for (const row of rows.slice(0, MAX_ROWS)) {
    const date = parseDate(String(row[dateKey] ?? ''));
    if (!date) continue;
    const description = String((descKey && row[descKey]) || 'Unlabelled transaction').trim();
    const category = String((catKey && row[catKey]) || 'Uncategorised').trim();
    if (typeKey && CREDIT_TYPE_RX.test(String(row[typeKey] ?? '').trim())) continue;
    if (INCOME_RX.test(description) || INCOME_RX.test(category)) continue;
    const amt = parseAmount(row[amountKey]);
    if (!Number.isFinite(amt) || amt === 0) continue;
    const amount = Math.abs(amt);
    out.push({
      id: hashString(`${date}|${description}|${amount}|${out.length}`),
      date,
      description,
      merchant: normalizeMerchant(description),
      amount,
      category,
    });
  }

  if (!out.length) throw new CsvError('Could not read any spending rows. Check the date and amount columns.');
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
