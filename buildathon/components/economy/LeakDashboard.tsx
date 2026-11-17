'use client';
import { useVestige } from '@/lib/store';
import { LeakHeatmap } from './LeakHeatmap';
import { LeakNetwork } from './LeakNetwork';
import { LeakBreakdown } from './LeakBreakdown';
import { StatCard } from '@/components/ui/StatCard';
import { inr, num } from '@/lib/format';
import { LEAK_META } from '@/lib/analysis';

export function LeakDashboard() {
  const { summary, leaks, fileName, source } = useVestige(s => s.economy);
  if (!summary) return null;

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-slate-500 font-display">{fileName || 'Live expense & bill ledger'}</p>
          <h2 className="font-display font-bold text-2xl text-slate-100 mt-1">Your invisible outflows</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-cy inline-block" /> {num(summary.txnCount)} projected entries · {summary.monthsCovered} months
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total leak" value={inr(summary.totalLeak)} sub={`${(summary.leakShare * 100).toFixed(1)}% of spend`} accent="#22f2ff" large />
        <StatCard label="Monthly leak" value={inr(summary.monthlyLeak)} sub="avg per month" accent="#22f2ff" />
        <StatCard label="Yearly projection" value={inr(summary.yearlyLeak)} sub="if habit unchanged" accent="#ff7a1a" />
        <StatCard label="Leak sources" value={String(leaks.length)} sub="distinct merchants" accent="#a855f7" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(LEAK_META) as (keyof typeof LEAK_META)[]).map(type => (
          <div key={type} className="rounded-xl border border-white/5 bg-ink-2/40 p-4">
            <div className="w-2 h-2 rounded-full mb-2" style={{ background: LEAK_META[type].color }} />
            <p className="text-xs text-slate-500">{LEAK_META[type].label}</p>
            <p className="font-display font-bold text-lg mt-1" style={{ color: LEAK_META[type].color }}>
              {inr(summary.byType[type])}
              <span className="text-xs text-slate-500 font-normal ml-1">/mo</span>
            </p>
          </div>
        ))}
      </div>

      <LeakNetwork />
      <LeakHeatmap />
      <LeakBreakdown />
    </div>
  );
}
