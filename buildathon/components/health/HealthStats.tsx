'use client';
import { useVestige } from '@/lib/store';
import { scoreTone, FACTOR_META, weakestFactors, HEALTH_PLAYBOOK } from '@/lib/health-model';
import { num } from '@/lib/format';
import { StatCard } from '@/components/ui/StatCard';

export function HealthStats() {
  const result = useVestige(s => s.health.result);
  const profile = useVestige(s => s.health.profile);
  const { label, color } = scoreTone(result.score);
  const weak = weakestFactors(result, 2);
  const sleepDebt = Math.max(0, (7.5 - profile.sleepHours) * 365);
  const sitDebt = Math.max(0, (profile.sittingHours - 6) * 0.5 * 260);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Health score" value={String(result.score)} sub={label} accent={color} large />
        <StatCard label="Sleep debt/yr" value={`${num(sleepDebt)} h`} sub={profile.sleepHours < 7.5 ? 'below optimal' : 'optimal sleep ✓'} accent={profile.sleepHours < 7.5 ? '#ff3d81' : '#3dffb5'} />
        <StatCard label="Sitting debt/yr" value={`${num(sitDebt)} h`} sub={`${profile.sittingHours}h seated/day`} accent={profile.sittingHours > 7 ? '#ff7a1a' : '#3dffb5'} />
        <StatCard label="Total debt/yr" value={`${num(result.debtHoursYear)} h`} sub="estimated hours in arrears" accent="#a855f7" />
      </div>

      {/* Prescriptions for weakest factors */}
      {weak.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display font-bold text-slate-200 text-lg">Your biggest opportunities</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {weak.map(f => {
              const val = result.factors[f];
              const col = val >= 45 ? '#22f2ff' : val >= 25 ? '#ff7a1a' : '#ff3d81';
              const pb = HEALTH_PLAYBOOK[f];
              return (
                <div key={f} className="rounded-2xl border p-5 space-y-3" style={{ borderColor: col + '33', background: col + '08' }}>
                  <div className="flex items-center justify-between">
                    <p className="font-display font-bold" style={{ color: col }}>{pb.title}</p>
                    <span className="text-xs font-display px-2 py-0.5 rounded-full" style={{ background: col + '22', color: col }}>
                      {FACTOR_META[f].label}: {val}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{pb.action}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
