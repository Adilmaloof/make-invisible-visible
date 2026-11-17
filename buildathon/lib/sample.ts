import { parseExpenseCsv } from './csv';
import type { Txn } from './types';

/** Deterministic PRNG so the demo ledger is identical on every machine. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Row {
  date: string;
  description: string;
  amount: number;
  category: string;
}

/**
 * Six months of a believable urban-India ledger. Habits intentionally
 * drift worse over time so "past vs present" tells a story.
 */
export function generateSampleRows(endYear = 2026, endMonth = 11): Row[] {
  const r = mulberry32(1337);
  const rows: Row[] = [];
  const months = 6;

  for (let i = months - 1; i >= 0; i--) {
    const dt = new Date(endYear, endMonth - 1 - i, 1);
    const y = dt.getFullYear();
    const m = dt.getMonth() + 1;
    const drift = months - 1 - i; // 0 → 5 (habits worsen)
    const day = (d: number) => `${y}-${String(m).padStart(2, '0')}-${String(Math.min(28, Math.max(1, d))).padStart(2, '0')}`;
    const add = (d: number, description: string, amount: number, category: string) =>
      rows.push({ date: day(d), description, amount: Math.round(amount), category });
    const ref = () => String(Math.floor(r() * 9e8) + 1e8);
    const rand = (min: number, max: number) => min + r() * (max - min);
    const rday = () => 1 + Math.floor(r() * 28);

    // Essentials
    add(1, 'NEFT RENT PAYMENT', 18000, 'Housing');
    add(10, 'BESCOM ELECTRICITY BILL', rand(1100, 1700), 'Utilities');
    add(3, 'BIGBASKET GROCERIES', rand(2200, 3100), 'Groceries');
    add(17, 'DMART GROCERIES', rand(1800, 2500), 'Groceries');
    add(8, 'AMAZON PURCHASE', rand(900, 3400), 'Shopping');

    // Ghost subscriptions
    add(5, 'NETFLIX.COM SUBSCRIPTION', 649, 'Entertainment');
    add(7, 'CULT.FIT MEMBERSHIP', 1499, 'Fitness');
    add(12, 'SPOTIFY INDIA', 119, 'Entertainment');
    add(15, 'DISNEY HOTSTAR', 299, 'Entertainment');
    add(18, 'APPLE ICLOUD STORAGE', 75, 'Utilities');
    if (drift >= 2) add(21, 'AUDIBLE MEMBERSHIP', 199, 'Entertainment');
    if (drift >= 3) add(23, 'CHATGPT PLUS SUBSCRIPTION', 1950, 'Software');

    // Dynamic pricing
    const swiggy = 5 + Math.floor(r() * 3) + drift;
    for (let k = 0; k < swiggy; k++)
      add(rday(), `UPI/SWIGGY/${ref()}`, rand(220, 520) * (r() > 0.7 ? 1.7 : 1), 'Food');
    const uber = 6 + Math.floor(r() * 3) + drift;
    for (let k = 0; k < uber; k++) add(rday(), 'UBER INDIA TRIP', rand(140, 360) * (r() > 0.72 ? 1.9 : 1), 'Transport');

    // Micro leaks
    const chai = 14 + Math.floor(r() * 6) + drift * 2;
    for (let k = 0; k < chai; k++) add(rday(), `UPI/RAMESH TEA STALL/${ref()}`, rand(15, 45), 'Food');
    const blinkit = 4 + Math.floor(r() * 3) + drift;
    for (let k = 0; k < blinkit; k++) add(rday(), `UPI/BLINKIT/${ref()}`, rand(49, 189), 'Groceries');
    for (let k = 0; k < 5; k++) add(rday(), `UPI/PAYTM PARKING/${ref()}`, rand(20, 60), 'Transport');

    // Fees
    if (i % 3 === 0) add(25, 'SMS ALERT CHARGES', 18, 'Bank');
    if (i === 2) add(22, 'CREDIT CARD LATE PAYMENT FEE', 590, 'Bank');
    if (i === 0) add(27, 'ATM DECLINED TXN CHARGE', 25, 'Bank');
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

export function sampleCsv(): string {
  const header = 'Date,Description,Amount,Category';
  const lines = generateSampleRows().map(
    (r) => `${r.date},"${r.description.replace(/"/g, '""')}",-${r.amount},${r.category}`,
  );
  return [header, ...lines].join('\n');
}

/** Runs the demo ledger through the exact same pipeline as a real upload. */
export function sampleTxns(): Txn[] {
  return parseExpenseCsv(sampleCsv());
}
