'use client';
import { useVestige } from '@/lib/store';
import { pastTimeLoss } from '@/lib/time-model';
import { pastHealth } from '@/lib/health-model';
import { num } from '@/lib/format';

function Delta({
  now, past, unit = '', invert = false, label,
}: { now: number; past: number; unit?: string; invert?: boolean; label: string }) {
  const delta = now - past;
  const worse = invert ? delta > 0 : delta < 0;
  const pct = past ? Math.round(Math.abs(delta / past) * 100) : 0;
  const color = worse ? '#ff3d81' : '#3dffb5';
  return (
    <div className="rounded-2xl border border-white/8 bg-ink-2/40 p-5 space-y-2">
      <p className="text-xs text-slate-500 font-display uppercase tracking-wider">{label}</p>
      <div className="flex items-end gap-3">
        <div>
          <p className="text-2xl font-display font-bold text-slate-200">{num(now)}{unit}</p>
          <p className="text-xs text-slate-600">now</p>
        </div>
        <div className="text-right flex-1">
          <p className="text-sm font-display" style={{ color }}>
            {delta > 0 ? '+' : ''}{num(delta)}{unit}
          </p>
          <p className="text-xs" style={{ color }}>{pct}% {worse ? 'worse' : 'better'}</p>
        </div>
      </div>
      <p className="text-xs text-slate-600">was {num(past)}{unit}</p>
    </div>
  );
}

export function ConvergenceStats() {
  const economy = useVestige((s) => s.economy);
  const time = useVestige((s) => s.time);
  const health = useVestige((s) => s.health);
  const result = time.result;
  const past = pastTimeLoss(time.profile);
  const hResult = health.result;
  const hPast = pastHealth(health.profile);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Delta label="Daily time lost" now={result.dailyLostHours} past={past.dailyLostHours} unit=" h" invert />
      <Delta label="Yearly time lost" now={result.yearlyLostHours} past={past.yearlyLostHours} unit=" h" invert />
      {economy.summary && (
        <Delta label="Monthly leak" now={economy.summary.monthlyLeak} past={economy.summary.monthlyLeak * 0.75} unit=" ₹" invert />
      )}
      <Delta label="Health score" now={hResult.score} past={hPast.score} />
    </div>
  );
}
