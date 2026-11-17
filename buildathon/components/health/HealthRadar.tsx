'use client';
import { useVestige } from '@/lib/store';
import { pastHealth, FACTOR_META } from '@/lib/health-model';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export function HealthRadar() {
  const profile = useVestige(s => s.health.profile);
  const result = useVestige(s => s.health.result);
  const past = pastHealth(profile);

  const data = (Object.keys(FACTOR_META) as (keyof typeof FACTOR_META)[]).map(f => ({
    axis: FACTOR_META[f].label,
    now: result.factors[f],
    past: past.factors[f],
  }));

  return (
    <div className="rounded-2xl border border-white/8 bg-ink-2/40 p-6">
      <h3 className="font-display font-semibold text-slate-300 text-sm mb-6">Health factors — now vs baseline</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="#ffffff0d" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Space Grotesk' }} />
          <Radar name="Now" dataKey="now" stroke="#3dffb5" fill="#3dffb5" fillOpacity={0.15} />
          <Radar name="Baseline" dataKey="past" stroke="#ff7a1a" fill="#ff7a1a" fillOpacity={0.08} strokeDasharray="4 4" />
          <Tooltip contentStyle={{ background: '#11141f', border: '1px solid #ffffff12', borderRadius: 8, fontSize: 12 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
