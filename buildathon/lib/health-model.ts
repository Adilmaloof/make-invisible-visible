import type { HealthFactor, HealthProfile, HealthResult } from './types';
import { clamp } from './format';

export const DEFAULT_HEALTH_PROFILE: HealthProfile = {
  sleepHours: 6,
  waterGlasses: 3,
  sittingHours: 9,
  movementMinutes: 10,
  postureBreaks: 1,
  breathBreaks: 0,
  pastSleepHours: 7,
  pastSittingHours: 7,
};

export const FACTOR_META: Record<HealthFactor, { label: string; hint: string; weight: number }> = {
  sleep: { label: 'Sleep', hint: '7.5–9 h restores memory, mood and metabolism.', weight: 0.3 },
  hydration: { label: 'Hydration', hint: '~8 glasses keeps focus and kidneys happy.', weight: 0.15 },
  movement: { label: 'Movement', hint: '30 active minutes offsets a desk day.', weight: 0.2 },
  posture: { label: 'Posture', hint: 'One stretch break per seated hour.', weight: 0.2 },
  breath: { label: 'Breath', hint: 'Screens make us hold our breath. Reset ~6×/day.', weight: 0.15 },
};

export function computeHealth(p: HealthProfile): HealthResult {
  const sleep =
    p.sleepHours < 7.5
      ? 100 - (7.5 - p.sleepHours) * 22
      : p.sleepHours > 9.5
        ? 100 - (p.sleepHours - 9.5) * 15
        : 100;
  const hydration = (p.waterGlasses / 8) * 100;
  const movement = (p.movementMinutes / 30) * 100 - Math.max(0, p.sittingHours - 6) * 5;
  const posture = 100 - Math.max(0, p.sittingHours - 4) * 8 + p.postureBreaks * 6;
  const breath = 20 + (p.breathBreaks / 6) * 80;

  const factors: Record<HealthFactor, number> = {
    sleep: Math.round(clamp(sleep, 0, 100)),
    hydration: Math.round(clamp(hydration, 0, 100)),
    movement: Math.round(clamp(movement, 0, 100)),
    posture: Math.round(clamp(posture, 0, 100)),
    breath: Math.round(clamp(breath, 0, 100)),
  };

  const score = Math.round(
    (Object.keys(factors) as HealthFactor[]).reduce((s, k) => s + factors[k] * FACTOR_META[k].weight, 0),
  );

  const sleepDebt = Math.max(0, 7.5 - p.sleepHours) * 365;
  const sitDebt = Math.max(0, p.sittingHours - 6) * 0.5 * 260;
  return {
    score,
    factors,
    debt: clamp(1 - score / 100, 0, 1),
    debtHoursYear: Math.round(sleepDebt + sitDebt),
  };
}

export const pastHealth = (p: HealthProfile) =>
  computeHealth({ ...p, sleepHours: p.pastSleepHours, sittingHours: p.pastSittingHours });

export const weakestFactors = (r: HealthResult, n = 2): HealthFactor[] =>
  (Object.keys(r.factors) as HealthFactor[]).sort((a, b) => r.factors[a] - r.factors[b]).slice(0, n);

export function scoreTone(score: number) {
  if (score >= 75) return { label: 'Balanced', color: '#3dffb5' };
  if (score >= 55) return { label: 'Strained', color: '#22f2ff' };
  if (score >= 35) return { label: 'In debt', color: '#ff7a1a' };
  return { label: 'Critical', color: '#ff3d5e' };
}

export interface HabitPreset {
  id: string;
  label: string;
  tone: 'bad' | 'good';
  patch: Partial<HealthProfile>;
}

export const HABIT_PRESETS: HabitPreset[] = [
  { id: 'sit', label: 'Sat for 9+ hours', tone: 'bad', patch: { sittingHours: 10, postureBreaks: 0 } },
  { id: 'water1', label: 'Only 1 glass of water', tone: 'bad', patch: { waterGlasses: 1 } },
  { id: 'sleep5', label: 'Slept 5 hours', tone: 'bad', patch: { sleepHours: 5 } },
  { id: 'apnea', label: 'Held breath through emails', tone: 'bad', patch: { breathBreaks: 0 } },
  { id: 'still', label: 'No walk today', tone: 'bad', patch: { movementMinutes: 0 } },
  { id: 'water8', label: 'Drank 8 glasses', tone: 'good', patch: { waterGlasses: 8 } },
  { id: 'walk', label: '30-min walk', tone: 'good', patch: { movementMinutes: 35 } },
  { id: 'sleep8', label: 'Slept 8 hours', tone: 'good', patch: { sleepHours: 8 } },
  { id: 'stretch', label: 'Stretched every hour', tone: 'good', patch: { postureBreaks: 8, sittingHours: 6 } },
  { id: 'breathe', label: 'Box-breathing ×6', tone: 'good', patch: { breathBreaks: 6 } },
];

export const HEALTH_PLAYBOOK: Record<HealthFactor, { title: string; action: string }> = {
  sleep: { title: 'Protect the 90-minute cycles', action: 'Fix a wake time 7 days a week, kill screens 45 min before bed, keep the room at ~19°C.' },
  hydration: { title: 'Make water the default', action: 'Keep a 1 L bottle on the desk. Pair every coffee with one glass.' },
  movement: { title: 'Movement snacks beat gym guilt', action: 'Three 10-minute walks after meals beat one skipped hour.' },
  posture: { title: 'Interrupt the chair every 50 minutes', action: 'Set a 50/10 timer: stand, roll shoulders, look 20 ft away for 20 s.' },
  breath: { title: 'Cure "screen apnea"', action: 'Before opening email, do 4-4-4-4 box breathing for one minute.' },
};

/**
 * Parses free text like "sat for 9 hours, drank only 1 glass of water, slept 5h"
 * into a profile patch. Deterministic and offline.
 */
export function parseHabitText(text: string): Partial<HealthProfile> {
  const t = text.toLowerCase();
  const patch: Partial<HealthProfile> = {};
  const numWord: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1 };
  const n = (s: string) => (s in numWord ? numWord[s] : parseFloat(s));
  const N = '(\\d+(?:\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|a)';

  let m = t.match(new RegExp(`(?:slept|sleep|sleeping)\\D{0,12}?${N}\\s*(?:h|hrs?|hours?)`));
  if (m) patch.sleepHours = clamp(n(m[1]), 0, 14);
  else if (/\b(barely slept|no sleep|didn'?t sleep|insomnia|all-?nighter|couldn'?t sleep)\b/.test(t)) patch.sleepHours = 4;
  else if (/\b(slept well|good sleep|full night)\b/.test(t)) patch.sleepHours = 8;

  m = t.match(new RegExp(`${N}\\s*(?:glass(?:es)?|cups?|bottles?)\\s*(?:of\\s*)?water`));
  if (m) patch.waterGlasses = clamp(n(m[1]) * (/bottle/.test(m[0]) ? 2 : 1), 0, 16);
  else if (/\b(no water|forgot to drink|dehydrated|thirsty)\b/.test(t)) patch.waterGlasses = 1;

  m = t.match(new RegExp(`(?:sat|sitting|seated|at (?:my|the) desk)\\D{0,12}?${N}\\s*(?:h|hrs?|hours?)`));
  if (m) patch.sittingHours = clamp(n(m[1]), 0, 16);
  else if (/\b(back hurts|back pain|neck pain|stiff neck|sore back|sat all day)\b/.test(t)) {
    patch.sittingHours = 10;
    patch.postureBreaks = 0;
  }

  m = t.match(new RegExp(`(?:walked|walk|ran|run|workout|exercised|gym|yoga|cycled)\\D{0,12}?${N}\\s*(min|mins|minutes|h|hrs?|hours?)\\b`));
  if (m) {
    const unitPart = m[0].replace(/.*?(\d+(?:\.\d+)?)\s*/, '').trim();
    patch.movementMinutes = clamp(n(m[1]) * (unitPart.startsWith('h') ? 60 : 1), 0, 240);
  }
  else if (/\b(went to the gym|worked out|went for a (?:walk|run)|did yoga)\b/.test(t)) patch.movementMinutes = 40;
  else if (/\b(didn'?t move|no exercise|skipped (?:the )?gym)\b/.test(t)) patch.movementMinutes = 0;

  if (/\b(stretch(?:ed)?|took breaks)\b/.test(t)) patch.postureBreaks = 6;
  if (/\b(breath(?:ing|ed)? (?:exercise|break)s?|meditat\w*|box breathing)\b/.test(t)) patch.breathBreaks = 6;
  if (/\b(headache|eye strain|tired eyes)\b/.test(t) && patch.breathBreaks === undefined) patch.breathBreaks = 0;

  return patch;
}
