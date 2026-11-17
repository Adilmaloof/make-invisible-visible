import type { TimeProfile, TimeResult } from './types';

/** Effective minutes of focus lost per context switch (conservative, research-informed). */
export const REFOCUS_MIN_PER_SWITCH = 1.5;
const WORKDAYS_PER_YEAR = 260;
const WAKING_HOURS_PER_YEAR = 16 * 365;

export const DEFAULT_TIME_PROFILE: TimeProfile = {
  screenHours: 7,
  doomHours: 2.5,
  switchesPerHour: 14,
  workHours: 8,
  pastDoomHours: 1.5,
  pastSwitchesPerHour: 9,
};

export function computeTimeLoss(p: { doomHours: number; switchesPerHour: number; workHours: number }): TimeResult {
  const doomDaily = Math.max(0, p.doomHours);
  const switchLossDaily = Math.min(p.workHours * 0.6, (p.switchesPerHour * p.workHours * REFOCUS_MIN_PER_SWITCH) / 60);
  const dailyLostHours = doomDaily + switchLossDaily;
  const yearly = doomDaily * 365 + switchLossDaily * WORKDAYS_PER_YEAR;
  return {
    doomDaily: round(doomDaily),
    switchLossDaily: round(switchLossDaily),
    dailyLostHours: round(dailyLostHours),
    yearlyLostHours: Math.round(yearly),
    lifetimeYears: round((yearly / WAKING_HOURS_PER_YEAR) * 50, 1),
  };
}

export const pastTimeLoss = (p: TimeProfile) =>
  computeTimeLoss({ doomHours: p.pastDoomHours, switchesPerHour: p.pastSwitchesPerHour, workHours: p.workHours });

function round(v: number, d = 2) {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

/** Turns hours into human-relatable equivalents. */
export function equivalents(hours: number) {
  return {
    workWeeks: Math.round(hours / 40),
    wakingDays: Math.round(hours / 16),
    books: Math.round(hours / 6),
    languages: +(hours / 600).toFixed(1),
    marathons: Math.round(hours / 120), // ~4 months of training each
  };
}
