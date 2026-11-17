'use client';
import { useVestige } from '@/lib/store';
import { equivalents, computeTimeLoss } from '@/lib/time-model';
import { num } from '@/lib/format';
import { StatCard } from '@/components/ui/StatCard';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

export function TimeStats() {
  const { profile, result } = useVestige(s => s.time);
  const past = computeTimeLoss({ doomHours: profile.pastDoomHours, switchesPerHour: profile.pastSwitchesPerHour, workHours: profile.workHours });
  const eq = equivalents(result.yearlyLostHours);
  const delta = result.yearlyLostHours - past.yearlyLostHours;

  const radarData = [
    { axis: 'Doom hours', current: result.doomDaily, past: past.doomDaily },
    { axis: 'Switch loss', current: result.switchLossDaily, past: past.switchLossDaily },
    { axis: 'Focus time', current: profile.workHours - result.dailyLostHours, past: profile.workHours - past.dailyLostHours },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Daily lost" value={`${result.dailyLostHours} h`} sub="per day" accent="#a855f7" large />
        <StatCard label="Yearly lost" value={`${num(result.yearlyLostHours)} h`} sub={delta > 0 ? `+${num(delta)} vs last year` : `${num(Math.abs(delta))} h better`} accent={delta > 0 ? '#ff3d81' : '#3dffb5'} />
        <StatCard label="Lifetime years" value={`${result.lifetimeYears} yr`} sub="at this rate over 50 y" accent="#ff7a1a" />
        <StatCard label="Books that takes" value={`${eq.books}`} sub={`or ${eq.workWeeks} work-weeks`} accent="#a855f7" />
      </div>
      <div className="rounded-2xl border border-white/8 bg-ink-2/40 p-6">
        <h3 className="font-display font-semibold text-slate-300 text-sm mb-4">Present vs past attention</h3>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#ffffff0d" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: '#64748b', fontSize: 11 }} />
            <Radar name="Now" dataKey="current" stroke="#a855f7" fill="#a855f7" fillOpacity={0.15} />
            <Radar name="Past" dataKey="past" stroke="#ff7a1a" fill="#ff7a1a" fillOpacity={0.08} strokeDasharray="4 4" />
            <Tooltip contentStyle={{ background: '#11141f', border: '1px solid #ffffff12', borderRadius: 8, fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
