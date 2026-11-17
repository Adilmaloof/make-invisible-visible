'use client';
import { useVestige } from '@/lib/store';
import { computeTimeLoss, pastTimeLoss } from '@/lib/time-model';
import { computeHealth, pastHealth } from '@/lib/health-model';
import { inr } from '@/lib/format';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, ReferenceLine,
} from 'recharts';

export function DualAxisChart() {
  const economy = useVestige((s) => s.economy);
  const time = useVestige((s) => s.time);
  const health = useVestige((s) => s.health);
  const result = time.result;
  const past = pastTimeLoss(time.profile);
  const hResult = health.result;
  const hPast = pastHealth(health.profile);

  // Build month-indexed series
  const months = economy.summary?.monthly ?? [];
  const data = months.length
    ? months.map((m, i) => {
        // Drift from past to present linearly across the data window
        const frac = months.length > 1 ? i / (months.length - 1) : 1;
        return {
          name: m.month.slice(0, 7),
          spend: m.spend,
          leak: m.leak,
          time: Math.round((past.dailyLostHours + (result.dailyLostHours - past.dailyLostHours) * frac) * 10) / 10,
          health: Math.round(hPast.score + (hResult.score - hPast.score) * frac),
        };
      })
    : [
        { name: 'Past', spend: 45000, leak: Math.round(past.dailyLostHours * 2200), time: past.dailyLostHours, health: hPast.score },
        { name: 'Now',  spend: 52000, leak: Math.round(result.dailyLostHours * 2800), time: result.dailyLostHours, health: hResult.score },
      ];

  return (
    <div className="rounded-2xl border border-white/8 bg-ink-2/40 p-6 space-y-4">
      <h3 className="font-display font-semibold text-slate-300 text-sm">Multi-axis drift — money, time & health</h3>
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 8" stroke="#ffffff07" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
          <YAxis yAxisId="money" orientation="left" tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={v => '₹' + (v/1000).toFixed(0) + 'k'} width={48} />
          <YAxis yAxisId="time" orientation="right" tick={{ fill: '#a855f7', fontSize: 10 }} unit="h" width={36} />
          <Tooltip
            contentStyle={{ background: '#11141f', border: '1px solid #ffffff12', borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine yAxisId="money" y={0} stroke="#ffffff0d" />
          <Area yAxisId="money" type="monotone" dataKey="spend" fill="#22f2ff0d" stroke="#22f2ff44" name="Total spend" strokeWidth={1.5} dot={false} />
          <Bar yAxisId="money" dataKey="leak" fill="#ff3d8166" radius={[4, 4, 0, 0]} name="Leak" />
          <Line yAxisId="time" type="monotone" dataKey="time" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 3 }} name="Daily lost (h)" />
          <Line yAxisId="time" type="monotone" dataKey="health" stroke="#3dffb5" strokeWidth={2} strokeDasharray="4 4" dot={{ fill: '#3dffb5', r: 3 }} name="Health score" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
