'use client';

import { useCallback, useEffect, useState } from 'react';
import { useVestige } from '@/lib/store';
import { LEAK_META } from '@/lib/analysis';
import { inr } from '@/lib/format';
import { MagButton } from '@/components/ui/MagButton';
import type { EconomySummary, Leak, LeakType, MonthPoint, Txn } from '@/lib/types';
import { clsx } from 'clsx';

export type ExpenseFreq = 'monthly' | 'weekly' | 'daily' | 'once';
export type ExpenseKind = 'bill' | 'subscription' | 'dynamic' | 'micro' | 'fee';

export interface EnteredExpense {
  id: string;
  name: string;
  amount: number;
  freq: ExpenseFreq;
  kind: ExpenseKind;
  usedRegularly?: boolean;
}

const FREQ_MULTIPLIER: Record<ExpenseFreq, number> = {
  monthly: 1,
  weekly: 4.33,
  daily: 30,
  once: 1 / 6,
};

const FREQ_LABEL: Record<ExpenseFreq, string> = {
  monthly: '/ month',
  weekly: '/ week',
  daily: '/ day',
  once: 'one-time',
};

const KIND_META: Record<
  ExpenseKind,
  { label: string; badge: string; color: string; leakType: LeakType | null; leakRatio: number; note: string }
> = {
  bill: {
    label: 'Essential Bill / Utility',
    badge: 'Essential Bill',
    color: '#94a3b8',
    leakType: null,
    leakRatio: 0,
    note: 'Fixed monthly bill or essential household utility.',
  },
  subscription: {
    label: 'Subscription / Membership',
    badge: 'Subscription',
    color: '#a855f7',
    leakType: 'subscription',
    leakRatio: 1,
    note: 'Recurring auto-renewal — audit usage and cancel if idle.',
  },
  dynamic: {
    label: 'Food Delivery / Cab Rides',
    badge: 'Surge & Convenience',
    color: '#ff7a1a',
    leakType: 'dynamic',
    leakRatio: 0.38,
    note: '~38% goes to surge pricing, platform fees, and delivery markups.',
  },
  micro: {
    label: 'Small Daily UPI / Snacks / Chai',
    badge: 'Micro-UPI',
    color: '#22f2ff',
    leakType: 'micro',
    leakRatio: 1,
    note: 'Small daily taps under ₹200 that compound silently over a year.',
  },
  fee: {
    label: 'Bank Fee / Late Charge / Convenience',
    badge: 'Fee / Penalty',
    color: '#ff3d81',
    leakType: 'fee',
    leakRatio: 1,
    note: 'Avoidable surcharge, late payment penalty, or convenience fee.',
  },
};

const QUICK_PRESETS: Omit<EnteredExpense, 'id'>[] = [
  { name: 'House Rent', amount: 18000, freq: 'monthly', kind: 'bill' },
  { name: 'Electricity Bill', amount: 1550, freq: 'monthly', kind: 'bill' },
  { name: 'Wi-Fi & Broadband', amount: 999, freq: 'monthly', kind: 'bill' },
  { name: 'Groceries & Milk', amount: 1400, freq: 'weekly', kind: 'bill' },
  { name: 'Netflix Subscription', amount: 649, freq: 'monthly', kind: 'subscription' },
  { name: 'Gym / Cult.fit Membership', amount: 1499, freq: 'monthly', kind: 'subscription' },
  { name: 'Spotify / Apple Music', amount: 119, freq: 'monthly', kind: 'subscription' },
  { name: 'ChatGPT / Cloud Storage', amount: 1950, freq: 'monthly', kind: 'subscription' },
  { name: 'Swiggy / Zomato Orders', amount: 780, freq: 'weekly', kind: 'dynamic' },
  { name: 'Uber / Ola Peak Rides', amount: 620, freq: 'weekly', kind: 'dynamic' },
  { name: 'Daily Chai & Coffee UPI', amount: 45, freq: 'daily', kind: 'micro' },
  { name: 'Blinkit / Instant Snacks', amount: 320, freq: 'weekly', kind: 'micro' },
  { name: 'Credit Card / Convenience Fees', amount: 450, freq: 'monthly', kind: 'fee' },
];

const DEFAULT_STARTER_EXPENSES: EnteredExpense[] = [
  { id: 'e-rent', name: 'House Rent', amount: 18000, freq: 'monthly', kind: 'bill' },
  { id: 'e-elec', name: 'Electricity Bill', amount: 1550, freq: 'monthly', kind: 'bill' },
  { id: 'e-wifi', name: 'Wi-Fi & Broadband', amount: 999, freq: 'monthly', kind: 'bill' },
  { id: 'e-netflix', name: 'Netflix Subscription', amount: 649, freq: 'monthly', kind: 'subscription' },
  { id: 'e-gym', name: 'Gym / Cult.fit Membership', amount: 1499, freq: 'monthly', kind: 'subscription' },
  { id: 'e-spotify', name: 'Spotify Premium', amount: 119, freq: 'monthly', kind: 'subscription' },
  { id: 'e-swiggy', name: 'Swiggy / Zomato Orders', amount: 780, freq: 'weekly', kind: 'dynamic' },
  { id: 'e-uber', name: 'Uber / Ola Peak Rides', amount: 620, freq: 'weekly', kind: 'dynamic' },
  { id: 'e-chai', name: 'Daily Chai & Coffee UPI', amount: 45, freq: 'daily', kind: 'micro' },
  { id: 'e-blinkit', name: 'Blinkit / Instant Snacks', amount: 320, freq: 'weekly', kind: 'micro' },
  { id: 'e-fee', name: 'Card & Convenience Fees', amount: 450, freq: 'monthly', kind: 'fee' },
];

const STORAGE_KEY = 'vestige-entered-expenses-v1';

function buildEconomyFromEntered(items: EnteredExpense[]): {
  txns: Txn[];
  leaks: Leak[];
  summary: EconomySummary;
} {
  const months = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
  const monthsCovered = months.length;
  const txns: Txn[] = [];
  const leaks: Leak[] = [];
  const byType: Record<LeakType, number> = { subscription: 0, micro: 0, dynamic: 0, fee: 0 };
  const spendByMonth: Record<string, number> = {};
  const leakByMonth: Record<string, number> = {};

  for (const m of months) {
    spendByMonth[m] = 0;
    leakByMonth[m] = 0;
  }

  items.forEach((item, idx) => {
    const monthlySpend = item.amount * FREQ_MULTIPLIER[item.freq];
    const meta = KIND_META[item.kind];
    const monthlyLeakVal = meta.leakType ? monthlySpend * meta.leakRatio : 0;
    const byBucket: Record<string, number> = {};

    months.forEach((m, mIdx) => {
      // Slight natural variation across months so charts & heatmaps look organic
      const drift = item.kind === 'bill' || item.kind === 'subscription' ? 1 : 0.86 + mIdx * 0.055;
      const mSpend = Math.round(monthlySpend * drift);
      const mLeak = Math.round(monthlyLeakVal * drift);

      spendByMonth[m] += mSpend;
      leakByMonth[m] += mLeak;
      if (mLeak > 0) byBucket[m] = mLeak;

      txns.push({
        id: `${item.id}-${m}`,
        date: `${m}-${String(((idx * 3 + mIdx * 2) % 26) + 1).padStart(2, '0')}`,
        description: item.name,
        merchant: item.name,
        amount: mSpend,
        category: meta.badge,
      });
    });

    if (meta.leakType && monthlyLeakVal > 0) {
      const totalLeakItem = Object.values(byBucket).reduce((s, v) => s + v, 0);
      const normMonthly = totalLeakItem / monthsCovered;
      byType[meta.leakType] += normMonthly;

      leaks.push({
        id: item.id,
        merchant: item.name,
        type: meta.leakType,
        total: totalLeakItem,
        monthly: normMonthly,
        count: item.freq === 'daily' ? 30 * monthsCovered : item.freq === 'weekly' ? 4 * monthsCovered : monthsCovered,
        note: meta.note,
        byBucket,
      });
    }
  });

  leaks.sort((a, b) => b.monthly - a.monthly);

  const totalSpend = Object.values(spendByMonth).reduce((s, v) => s + v, 0);
  const totalLeak = Object.values(leakByMonth).reduce((s, v) => s + v, 0);
  const monthlyLeak = totalLeak / monthsCovered;

  const monthly: MonthPoint[] = months.map((month) => ({
    month,
    spend: Math.round(spendByMonth[month] ?? 0),
    leak: Math.round(leakByMonth[month] ?? 0),
  }));

  return {
    txns,
    leaks,
    summary: {
      buckets: months,
      bucketMode: 'month',
      monthsCovered,
      txnCount: txns.length,
      totalSpend,
      totalLeak,
      monthlyLeak,
      yearlyLeak: monthlyLeak * 12,
      leakShare: totalSpend > 0 ? totalLeak / totalSpend : 0,
      byType,
      monthly,
    },
  };
}

export function UploadZone() {
  const setEconomy = useVestige((s) => s.setEconomy);
  const clearEconomy = useVestige((s) => s.clearEconomy);
  const currentSummary = useVestige((s) => s.economy.summary);

  const [items, setItems] = useState<EnteredExpense[]>(DEFAULT_STARTER_EXPENSES);
  const [hydrated, setHydrated] = useState(false);

  // Form state for adding a custom expense or bill
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [freq, setFreq] = useState<ExpenseFreq>('monthly');
  const [kind, setKind] = useState<ExpenseKind>('subscription');
  const [error, setError] = useState('');

  const syncToStore = useCallback(
    (nextItems: EnteredExpense[]) => {
      if (nextItems.length === 0) {
        clearEconomy();
        return;
      }
      const { txns, leaks, summary } = buildEconomyFromEntered(nextItems);
      setEconomy({
        txns,
        leaks,
        summary,
        source: 'sample',
        fileName: `${nextItems.length} bills & expenses entered`,
      });
    },
    [setEconomy, clearEconomy],
  );

  // Load persisted entered items on mount and sync with global store
  useEffect(() => {
    let initialItems = DEFAULT_STARTER_EXPENSES;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as EnteredExpense[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialItems = parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    setItems(initialItems);
    setHydrated(true);
    if (!currentSummary) {
      syncToStore(initialItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateItems = (next: EnteredExpense[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    syncToStore(next);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const numAmount = parseFloat(amount);
    if (!cleanName) {
      setError('Please enter a bill or expense name (e.g. Netflix, Electricity Bill, Chai).');
      return;
    }
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount in ₹.');
      return;
    }
    setError('');
    const newItem: EnteredExpense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      amount: Math.round(numAmount),
      freq,
      kind,
    };
    updateItems([newItem, ...items]);
    setName('');
    setAmount('');
  };

  const togglePreset = (preset: Omit<EnteredExpense, 'id'>) => {
    const existing = items.find((i) => i.name.toLowerCase() === preset.name.toLowerCase());
    if (existing) {
      updateItems(items.filter((i) => i.id !== existing.id));
    } else {
      updateItems([
        {
          ...preset,
          id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        },
        ...items,
      ]);
    }
  };

  const removeItem = (id: string) => {
    updateItems(items.filter((i) => i.id !== id));
  };

  const totalMonthlySpend = items.reduce((sum, i) => sum + i.amount * FREQ_MULTIPLIER[i.freq], 0);
  const totalMonthlyLeak = items.reduce((sum, i) => {
    const meta = KIND_META[i.kind];
    return sum + (meta.leakType ? i.amount * FREQ_MULTIPLIER[i.freq] * meta.leakRatio : 0);
  }, 0);

  if (!hydrated) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-ink-2/60 backdrop-blur-xl p-6 md:p-8 space-y-8 shadow-[0_0_80px_#22f2ff08]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <span className="chapter-badge text-cy">Interactive Ledger</span>
          <h2 className="font-display font-bold text-2xl text-slate-100 mt-1">
            Enter Your Monthly Bills & Daily Expenses
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Add your recurring bills, subscriptions, food deliveries, and daily UPI expenses — Vestige automatically separates essential bills from hidden financial leaks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MagButton
            variant="ghost"
            size="sm"
            onClick={() => updateItems(DEFAULT_STARTER_EXPENSES)}
          >
            Reset Demo Bills ↺
          </MagButton>
          {items.length > 0 && (
            <button
              onClick={() => updateItems([])}
              className="text-xs font-display text-slate-500 hover:text-fe px-3 py-2 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Add Expense / Bill Form */}
      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        <div className="lg:col-span-4 space-y-1.5">
          <label className="text-xs font-display text-slate-400 block">Expense or Bill Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Electricity Bill, Netflix, Swiggy, Chai…"
            className="w-full rounded-xl border border-white/10 bg-ink-3/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cy/50 focus:outline-none"
          />
        </div>

        <div className="lg:col-span-2 space-y-1.5">
          <label className="text-xs font-display text-slate-400 block">Amount (₹)</label>
          <input
            type="number"
            min="1"
            step="any"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
            placeholder="e.g. 649"
            className="w-full rounded-xl border border-white/10 bg-ink-3/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cy/50 focus:outline-none"
          />
        </div>

        <div className="lg:col-span-2 space-y-1.5">
          <label className="text-xs font-display text-slate-400 block">Frequency</label>
          <select
            value={freq}
            onChange={(e) => setFreq(e.target.value as ExpenseFreq)}
            className="w-full rounded-xl border border-white/10 bg-ink-3/80 px-3 py-2.5 text-sm text-slate-200 focus:border-cy/50 focus:outline-none"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
            <option value="once">One-time</option>
          </select>
        </div>

        <div className="lg:col-span-2 space-y-1.5">
          <label className="text-xs font-display text-slate-400 block">Category</label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ExpenseKind)}
            className="w-full rounded-xl border border-white/10 bg-ink-3/80 px-3 py-2.5 text-sm text-slate-200 focus:border-cy/50 focus:outline-none"
          >
            <option value="bill">Essential Bill / Rent</option>
            <option value="subscription">Subscription</option>
            <option value="dynamic">Food / Cab Surge</option>
            <option value="micro">Small Daily UPI</option>
            <option value="fee">Bank / Late Fee</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <button
            type="submit"
            className="w-full rounded-xl border border-cy/40 bg-cy/10 hover:bg-cy/20 text-cy font-display font-semibold text-sm py-2.5 px-4 transition-all hover:shadow-[0_0_24px_#22f2ff33]"
          >
            + Add Entry
          </button>
        </div>
      </form>

      {error && <p className="text-fe text-xs font-display">{error}</p>}

      {/* Quick-toggle common bills & expenses */}
      <div className="space-y-2.5">
        <p className="text-xs font-display text-slate-500 uppercase tracking-wider">
          Quick-toggle common bills & daily expenses
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map((p) => {
            const active = items.some((i) => i.name.toLowerCase() === p.name.toLowerCase());
            const meta = KIND_META[p.kind];
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => togglePreset(p)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-display transition-all border flex items-center gap-1.5',
                  active
                    ? 'text-slate-100 bg-white/10 border-white/25'
                    : 'text-slate-500 bg-white/[0.02] border-white/8 hover:text-slate-300 hover:border-white/15',
                )}
                style={active ? { borderColor: `${meta.color}66`, boxShadow: `0 0 14px ${meta.color}22` } : {}}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                <span>{p.name}</span>
                <span className="text-[11px] opacity-70">
                  {inr(p.amount)}
                  {p.freq === 'daily' ? '/d' : p.freq === 'weekly' ? '/wk' : '/mo'}
                </span>
                <span className="text-[10px] ml-0.5">{active ? '✓' : '+'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live list of entered bills & expenses */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-display">
          <span className="text-slate-400 uppercase tracking-wider">
            Your Active Bills & Expenses ({items.length})
          </span>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              Total Monthly Outflow: <strong className="text-slate-100">{inr(totalMonthlySpend)}/mo</strong>
            </span>
            <span className="text-cy">
              Detected Leak: <strong>{inr(totalMonthlyLeak)}/mo</strong>
            </span>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-slate-500 text-sm font-display">
            No bills or expenses entered yet. Use the form above or click any quick-toggle chip to begin.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {items.map((item) => {
              const meta = KIND_META[item.kind];
              const monthlyEq = Math.round(item.amount * FREQ_MULTIPLIER[item.freq]);
              const leakMonthly = meta.leakType ? Math.round(monthlyEq * meta.leakRatio) : 0;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/8 bg-ink-3/50 p-3.5 flex items-start justify-between gap-2 hover:border-white/15 transition-all"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: meta.color }}
                      />
                      <p className="font-display font-semibold text-xs text-slate-200 truncate">
                        {item.name}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 font-display">
                      {inr(item.amount)} {FREQ_LABEL[item.freq]} ·{' '}
                      <span className="text-slate-300">{inr(monthlyEq)}/mo</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-display px-2 py-0.5 rounded-full"
                        style={{ background: `${meta.color}18`, color: meta.color }}
                      >
                        {meta.badge}
                      </span>
                      {leakMonthly > 0 && (
                        <span className="text-[10px] font-display text-fe">
                          Leak ~{inr(leakMonthly)}/mo
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    title="Remove entry"
                    className="text-slate-600 hover:text-fe text-sm px-1.5 py-0.5 rounded transition-colors"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
