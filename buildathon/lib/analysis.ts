import type { EconomySummary, Leak, LeakType, MonthPoint, Txn } from './types';
import { inr } from './format';

const SUB_KW =
  /netflix|spotify|prime video|amazon prime|hotstar|disney|youtube premium|icloud|apple music|apple one|google one|gym|cult\.?fit|zee5|sonyliv|jio ?cinema|audible|adobe|canva|chatgpt|openai|notion|linkedin premium|subscription|membership|renewal/i;
const DYN_KW = /uber|ola\b|rapido|swiggy|zomato|zepto|blinkit|instamart|bigbasket now|makemytrip|irctc|indigo|flight|surge|bookmyshow/i;
const FEE_KW = /\bfee\b|\bfees\b|charge|penalty|late payment|convenience|surcharge|overdraft|annual fee|declined/i;

export const MICRO_MAX = 200;

export const LEAK_META: Record<LeakType, { label: string; color: string; short: string }> = {
  subscription: { label: 'Ghost subscriptions', color: '#a855f7', short: 'Subscription' },
  micro: { label: 'Micro-transactions', color: '#22f2ff', short: 'Micro' },
  dynamic: { label: 'Dynamic-pricing losses', color: '#ff7a1a', short: 'Surge' },
  fee: { label: 'Fees & penalties', color: '#ff3d81', short: 'Fee' },
};

const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
const mean = (a: number[]) => (a.length ? sum(a) / a.length : 0);
function median(a: number[]) {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function stdev(a: number[]) {
  const mu = mean(a);
  return Math.sqrt(mean(a.map((v) => (v - mu) ** 2)));
}

function weekKey(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  const start = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function analyzeLeaks(txns: Txn[]): { leaks: Leak[]; summary: EconomySummary } {
  const monthKeys = [...new Set(txns.map((t) => t.date.slice(0, 7)))].sort();
  const monthsCovered = Math.max(1, monthKeys.length);
  const bucketMode: 'month' | 'week' = monthKeys.length >= 2 ? 'month' : 'week';
  const bucketOf = (d: string) => (bucketMode === 'month' ? d.slice(0, 7) : weekKey(d));
  const buckets = [...new Set(txns.map((t) => bucketOf(t.date)))].sort();

  const groups = new Map<string, Txn[]>();
  for (const t of txns) {
    const list = groups.get(t.merchant);
    if (list) list.push(t);
    else groups.set(t.merchant, [t]);
  }

  const leaks: Leak[] = [];
  const leakByMonth: Record<string, number> = {};

  for (const [merchant, list] of groups) {
    const raw = list.map((t) => t.description).join(' | ');
    const amounts = list.map((t) => t.amount);
    const mu = mean(amounts);
    const cv = mu ? stdev(amounts) / mu : 1;
    const monthsSeen = new Set(list.map((t) => t.date.slice(0, 7)));

    let type: LeakType | null = null;
    let leakTx: { t: Txn; v: number }[] = [];
    let note = '';

    if (FEE_KW.test(raw)) {
      type = 'fee';
      leakTx = list.filter((t) => FEE_KW.test(t.description)).map((t) => ({ t, v: t.amount }));
      note = 'Bank fees & penalties — fully avoidable with alerts and autopay.';
    } else if (SUB_KW.test(raw) || (monthsSeen.size >= 2 && cv < 0.08 && list.length <= monthsSeen.size + 1 && mu >= 49)) {
      type = 'subscription';
      leakTx = list.map((t) => ({ t, v: t.amount }));
      note = `Recurring ${inr(mu)} charge seen in ${monthsSeen.size} month${monthsSeen.size > 1 ? 's' : ''}. Do you still use it?`;
    } else if (DYN_KW.test(raw) && list.length >= 3) {
      const med = median(amounts);
      leakTx = list.map((t) => ({ t, v: Math.max(0, t.amount - med) })).filter((x) => x.v > 0);
      type = 'dynamic';
      note = `Paid above your median of ${inr(med)} on ${leakTx.length} occasions — surge & dynamic pricing.`;
    } else {
      const micro = list.filter((t) => t.amount <= MICRO_MAX);
      if (micro.length >= 3) {
        type = 'micro';
        leakTx = micro.map((t) => ({ t, v: t.amount }));
        note = `${micro.length} payments under ₹${MICRO_MAX}. Invisible alone, heavy together.`;
      }
    }

    if (!type || !leakTx.length) continue;
    const total = sum(leakTx.map((x) => x.v));
    if (total <= 0) continue;

    const byBucket: Record<string, number> = {};
    for (const { t, v } of leakTx) {
      const b = bucketOf(t.date);
      byBucket[b] = (byBucket[b] ?? 0) + v;
      const m = t.date.slice(0, 7);
      leakByMonth[m] = (leakByMonth[m] ?? 0) + v;
    }

    leaks.push({
      id: slug(`${type}-${merchant}`),
      merchant,
      type,
      total,
      monthly: total / monthsCovered,
      count: leakTx.length,
      note,
      byBucket,
    });
  }

  leaks.sort((a, b) => b.monthly - a.monthly);

  const totalSpend = sum(txns.map((t) => t.amount));
  const totalLeak = sum(leaks.map((l) => l.total));
  const monthlyLeak = totalLeak / monthsCovered;
  const byType: Record<LeakType, number> = { subscription: 0, micro: 0, dynamic: 0, fee: 0 };
  for (const l of leaks) byType[l.type] += l.monthly;

  const spendByMonth: Record<string, number> = {};
  for (const t of txns) {
    const m = t.date.slice(0, 7);
    spendByMonth[m] = (spendByMonth[m] ?? 0) + t.amount;
  }
  const monthly: MonthPoint[] = monthKeys.map((m) => ({
    month: m,
    spend: Math.round(spendByMonth[m] ?? 0),
    leak: Math.round(leakByMonth[m] ?? 0),
  }));

  return {
    leaks,
    summary: {
      buckets,
      bucketMode,
      monthsCovered,
      txnCount: txns.length,
      totalSpend,
      totalLeak,
      monthlyLeak,
      yearlyLeak: monthlyLeak * 12,
      leakShare: totalSpend ? totalLeak / totalSpend : 0,
      byType,
      monthly,
    },
  };
}
