// ─────────────────────────────────────────────────────────────
// Vestige — shared domain types (safe for server + client)
// ─────────────────────────────────────────────────────────────

export type ChapterId = 'economy' | 'time' | 'effort' | 'health' | 'convergence' | 'oracle';
export type RouteTarget = 'economy' | 'time' | 'effort' | 'health';
export type ProductId = 'phone' | 'coffee' | 'tshirt' | 'package';

/* ── Economy ─────────────────────────────────────────────── */
export interface Txn {
  id: string;
  /** ISO date yyyy-mm-dd */
  date: string;
  description: string;
  merchant: string;
  amount: number;
  category: string;
}

export type LeakType = 'subscription' | 'micro' | 'dynamic' | 'fee';

export interface Leak {
  id: string;
  merchant: string;
  type: LeakType;
  /** Total leaked across the whole ledger */
  total: number;
  /** Normalised monthly leak */
  monthly: number;
  count: number;
  note: string;
  /** Leak amount per heatmap bucket (month or week key) */
  byBucket: Record<string, number>;
}

export interface MonthPoint {
  month: string; // yyyy-mm
  spend: number;
  leak: number;
}

export interface EconomySummary {
  buckets: string[];
  bucketMode: 'month' | 'week';
  monthsCovered: number;
  txnCount: number;
  totalSpend: number;
  totalLeak: number;
  monthlyLeak: number;
  yearlyLeak: number;
  leakShare: number;
  byType: Record<LeakType, number>;
  monthly: MonthPoint[];
}

/* ── Time ────────────────────────────────────────────────── */
export interface TimeProfile {
  screenHours: number;
  doomHours: number;
  switchesPerHour: number;
  workHours: number;
  pastDoomHours: number;
  pastSwitchesPerHour: number;
}

export interface TimeResult {
  doomDaily: number;
  switchLossDaily: number;
  dailyLostHours: number;
  yearlyLostHours: number;
  /** Waking years lost over the next 50 years at this rate */
  lifetimeYears: number;
}

/* ── Health ──────────────────────────────────────────────── */
export interface HealthProfile {
  sleepHours: number;
  waterGlasses: number;
  sittingHours: number;
  movementMinutes: number;
  /** Posture / stretch breaks per day */
  postureBreaks: number;
  /** Conscious breathing breaks per day (counters "screen apnea") */
  breathBreaks: number;
  /** Baseline (a year ago) — for The Convergence */
  pastSleepHours: number;
  pastSittingHours: number;
}

export type HealthFactor = 'sleep' | 'hydration' | 'movement' | 'posture' | 'breath';

export interface HealthResult {
  /** 0–100, higher is healthier */
  score: number;
  factors: Record<HealthFactor, number>;
  /** 0–1, drives the WebGL distortion */
  debt: number;
  /** Rough "health debt" hours accrued per year */
  debtHoursYear: number;
}

/* ── Gatekeeper ──────────────────────────────────────────── */
export interface Signals {
  hours?: number;
  amount?: number;
  product?: ProductId;
  /** Health-specific extracted signals */
  sleepHours?: number;
  waterGlasses?: number;
  sittingHours?: number;
}

export interface GateDecision {
  route: RouteTarget | null;
  confidence: number;
  reply: string;
  signals: Signals;
  source: 'ai' | 'heuristic';
  alternatives: RouteTarget[];
}

export interface JournalEntry {
  text: string;
  route: RouteTarget | null;
  confidence: number;
  source: 'ai' | 'heuristic';
  at: number;
}

/* ── Oracle ──────────────────────────────────────────────── */
export type OracleCategory = 'money' | 'time' | 'human' | 'mind' | 'body';

export interface OracleCard {
  id: string;
  year: number;
  category: OracleCategory;
  title: string;
  insight: string;
  action: string;
  metric?: string;
  size: 'sm' | 'md' | 'lg';
}

export interface OracleContext {
  money: {
    hasData: boolean;
    monthlyLeak: number;
    yearlyLeak: number;
    leakShare: number;
    topLeaks: { merchant: string; type: LeakType; monthly: number }[];
  };
  time: {
    doomHours: number;
    switchesPerHour: number;
    workHours: number;
    dailyLost: number;
    yearlyLost: number;
    pastDailyLost: number;
  };
  effort: { explored: ProductId[]; workers: number; humanHours: number };
  health: {
    hasData: boolean;
    score: number;
    pastScore: number;
    sleepHours: number;
    waterGlasses: number;
    sittingHours: number;
    movementMinutes: number;
    weakest: HealthFactor[];
  };
  intents: string[];
}
