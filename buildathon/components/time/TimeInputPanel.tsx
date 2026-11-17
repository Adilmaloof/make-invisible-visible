'use client';
import { useVestige } from '@/lib/store';
import { DEFAULT_TIME_PROFILE } from '@/lib/time-model';

const sliders = [
  { key: 'doomHours', label: 'Doomscrolling / social media', min: 0, max: 12, step: 0.5, unit: 'h/day', accent: '#a855f7' },
  { key: 'switchesPerHour', label: 'Context switches per work-hour', min: 0, max: 40, step: 1, unit: 'times/h', accent: '#a855f7' },
  { key: 'workHours', label: 'Work / focus hours per day', min: 1, max: 16, step: 0.5, unit: 'h/day', accent: '#22f2ff' },
  { key: 'pastDoomHours', label: 'Doomscrolling a year ago', min: 0, max: 12, step: 0.5, unit: 'h/day', accent: '#ff7a1a' },
  { key: 'pastSwitchesPerHour', label: 'Context switches a year ago', min: 0, max: 40, step: 1, unit: 'times/h', accent: '#ff7a1a' },
] as const;

export function TimeInputPanel() {
  const profile = useVestige(s => s.time.profile);
  const setTimeProfile = useVestige(s => s.setTimeProfile);

  return (
    <div className="rounded-3xl border border-white/8 bg-ink-2/60 p-8 space-y-7 backdrop-blur-sm">
      <div>
        <h2 className="font-display font-bold text-xl text-slate-100">Set your attention profile</h2>
        <p className="text-slate-500 text-sm mt-1">Slide to match your typical day — the canvas reacts in real time.</p>
      </div>
      {sliders.map(({ key, label, min, max, step, unit, accent }) => {
        const v = profile[key];
        const pct = ((v - min) / (max - min)) * 100;
        return (
          <div key={key} className="space-y-2">
            <div className="flex justify-between text-xs font-display">
              <span className="text-slate-400">{label}</span>
              <span style={{ color: accent }} className="font-semibold">{v} {unit}</span>
            </div>
            <div className="relative h-1.5 rounded-full bg-white/8">
              <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: pct + '%', background: accent, boxShadow: `0 0 8px ${accent}66` }} />
              <input
                type="range" min={min} max={max} step={step} value={v}
                onChange={e => setTimeProfile({ [key]: parseFloat(e.target.value) })}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
