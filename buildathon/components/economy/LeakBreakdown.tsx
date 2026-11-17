'use client';
import { useVestige } from '@/lib/store';
import { inr } from '@/lib/format';
import { LEAK_META } from '@/lib/analysis';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function LeakBreakdown() {
  const { leaks, summary } = useVestige(s => s.economy);
  if (!summary) return null;

  const data = leaks.slice(0, 10).map(l => ({ name: l.merchant.slice(0, 12), value: Math.round(l.monthly), type: l.type }));

  return (
    <div className="rounded-2xl border border-white/8 bg-ink-2/40 p-6">
      <h3 className="font-display font-semibold text-slate-300 text-sm mb-6">Top leaks by monthly cost</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => '₹' + v} width={48} />
          <Tooltip
            contentStyle={{ background: '#11141f', border: '1px solid #ffffff12', borderRadius: 10, fontSize: 12 }}
            formatter={(v: number) => [inr(v), 'Monthly leak']}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={LEAK_META[d.type].color} fillOpacity={0.8} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-6 space-y-2 max-h-48 overflow-y-auto pr-1">
        {leaks.slice(0, 12).map(l => (
          <div key={l.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
            <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ background: LEAK_META[l.type].color }} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-2">
                <p className="text-sm text-slate-300 font-display font-medium truncate">{l.merchant}</p>
                <p className="text-sm font-bold flex-shrink-0" style={{ color: LEAK_META[l.type].color }}>{inr(l.monthly)}/mo</p>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">{l.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
