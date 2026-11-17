'use client';
import { useState } from 'react';
import { useVestige } from '@/lib/store';
import { HABIT_PRESETS, FACTOR_META, parseHabitText, scoreTone, type HabitPreset } from '@/lib/health-model';
import { clsx } from 'clsx';

const sliders = [
  { key: 'sleepHours', label: 'Sleep', min: 0, max: 12, step: 0.5, unit: 'h', icon: '🌙', accent: '#a855f7' },
  { key: 'waterGlasses', label: 'Water', min: 0, max: 16, step: 1, unit: ' glasses', icon: '💧', accent: '#22f2ff' },
  { key: 'sittingHours', label: 'Sitting', min: 0, max: 16, step: 0.5, unit: 'h', icon: '🪑', accent: '#ff7a1a', invert: true },
  { key: 'movementMinutes', label: 'Movement', min: 0, max: 120, step: 5, unit: ' min', icon: '🏃', accent: '#3dffb5' },
  { key: 'postureBreaks', label: 'Stretch breaks', min: 0, max: 20, step: 1, unit: 'x', icon: '🧘', accent: '#3dffb5' },
  { key: 'breathBreaks', label: 'Breath breaks', min: 0, max: 12, step: 1, unit: 'x', icon: '🫁', accent: '#22f2ff' },
] as const;

export function HabitPanel() {
  const profile = useVestige(s => s.health.profile);
  const result = useVestige(s => s.health.result);
  const setHealthProfile = useVestige(s => s.setHealthProfile);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'sliders' | 'text' | 'presets'>('presets');
  const { label, color } = scoreTone(result.score);

  const applyPreset = (p: HabitPreset) => setHealthProfile(p.patch);

  const applyText = () => {
    const patch = parseHabitText(text);
    if (Object.keys(patch).length) { setHealthProfile(patch); setText(''); }
  };

  return (
    <div className="space-y-6">
      {/* Score badge */}
      <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ borderColor: color + '33', background: color + '08' }}>
        <div className="text-5xl font-display font-bold" style={{ color, textShadow: `0 0 30px ${color}66` }}>{result.score}</div>
        <div>
          <p className="font-display font-bold text-lg" style={{ color }}>{label}</p>
          <p className="text-xs text-slate-500">health score — {result.debtHoursYear} debt hours / year</p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-ink-3/60 border border-white/5">
        {(['presets', 'sliders', 'text'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={clsx('flex-1 py-2 rounded-lg text-xs font-display font-semibold transition-all capitalize',
              mode === m ? 'bg-bio/10 text-bio' : 'text-slate-500 hover:text-slate-300')}>
            {m === 'presets' ? '⚡ Quick habits' : m === 'sliders' ? '🎚 Sliders' : '✍️ Describe'}
          </button>
        ))}
      </div>

      {mode === 'presets' && (
        <div className="grid grid-cols-2 gap-2">
          {HABIT_PRESETS.map(p => (
            <button key={p.id} onClick={() => applyPreset(p)}
              className={clsx(
                'p-3 rounded-xl border text-left text-xs font-display transition-all',
                p.tone === 'bad'
                  ? 'border-fe/20 bg-fe/5 text-fe/80 hover:bg-fe/10 hover:text-fe'
                  : 'border-bio/20 bg-bio/5 text-bio/80 hover:bg-bio/10 hover:text-bio'
              )}>
              {p.label}
            </button>
          ))}
        </div>
      )}

      {mode === 'sliders' && (
        <div className="space-y-5">
          {sliders.map(({ key, label, min, max, step, unit, icon, accent }) => {
            const v = profile[key] ?? 0;
            const pct = ((v - min) / (max - min)) * 100;
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between text-xs font-display">
                  <span className="text-slate-400">{icon} {label}</span>
                  <span style={{ color: accent }} className="font-semibold">{v}{unit}</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-white/8">
                  <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: pct + '%', background: accent, boxShadow: `0 0 8px ${accent}66` }} />
                  <input type="range" min={min} max={max} step={step} value={v}
                    onChange={e => setHealthProfile({ [key]: parseFloat(e.target.value) })}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode === 'text' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">Describe your day — the AI reads it into your health profile.</p>
          <textarea rows={4} value={text} onChange={e => setText(e.target.value)}
            placeholder='e.g. "sat for 9 hours, only drank 1 glass of water, slept 5h, back hurts"'
            className="w-full bg-ink-3/60 border border-white/8 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 resize-none focus:outline-none focus:border-bio/40 font-sans" />
          <button onClick={applyText}
            className="w-full py-2.5 rounded-xl border border-bio/30 bg-bio/5 hover:bg-bio/10 text-bio text-sm font-display font-semibold transition-all">
            Apply to body model →
          </button>
        </div>
      )}

      {/* Factor bars */}
      <div className="rounded-2xl border border-white/8 bg-ink-2/40 p-5 space-y-3">
        <p className="text-xs font-display text-slate-500 uppercase tracking-wider">Factor breakdown</p>
        {(Object.keys(FACTOR_META) as (keyof typeof FACTOR_META)[]).map(f => {
          const val = result.factors[f];
          const { label, hint, weight } = FACTOR_META[f];
          const col = val >= 70 ? '#3dffb5' : val >= 45 ? '#22f2ff' : val >= 25 ? '#ff7a1a' : '#ff3d81';
          return (
            <div key={f} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-display">{label}</span>
                <span style={{ color: col }} className="font-bold font-display">{val}</span>
              </div>
              <div className="h-1 rounded-full bg-white/8">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: val + '%', background: col, boxShadow: `0 0 6px ${col}66` }} />
              </div>
              <p className="text-[10px] text-slate-600">{hint}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
