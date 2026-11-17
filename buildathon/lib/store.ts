'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  ChapterId,
  EconomySummary,
  HealthProfile,
  HealthResult,
  JournalEntry,
  Leak,
  OracleCard,
  ProductId,
  Signals,
  TimeProfile,
  TimeResult,
  Txn,
} from './types';
import { computeTimeLoss, DEFAULT_TIME_PROFILE } from './time-model';
import { computeHealth, DEFAULT_HEALTH_PROFILE } from './health-model';

// ─────────────────────────────────────────────────────────────
// Global, persisted state. Every chapter writes here; The
// Convergence and The Oracle read from it. Persisted to
// localStorage so data survives transitions and reloads.
// ─────────────────────────────────────────────────────────────

interface EconomyState {
  txns: Txn[];
  leaks: Leak[];
  summary: EconomySummary | null;
  source: 'csv' | 'sample' | null;
  fileName: string | null;
}

interface HealthState {
  profile: HealthProfile;
  result: HealthResult;
  /** Global Health Score (0–100) — mirrored for quick access */
  score: number;
  /** Whether the user has interacted with the Health chapter */
  touched: boolean;
  history: { at: number; score: number }[];
}

interface OracleState {
  cards: OracleCard[];
  generatedAt: number | null;
  source: 'ai' | 'fallback' | null;
  fingerprint: string | null;
}

export interface VestigeState {
  economy: EconomyState;
  time: { profile: TimeProfile; result: TimeResult; touched: boolean };
  effort: { explored: ProductId[]; workers: number; humanHours: number };
  health: HealthState;
  journal: JournalEntry[];
  hints: Signals;
  oracle: OracleState;
  visited: ChapterId[];

  setEconomy: (e: Omit<EconomyState, never>) => void;
  clearEconomy: () => void;
  setTimeProfile: (patch: Partial<TimeProfile>) => void;
  exploreProduct: (id: ProductId, workers: number, minutes: number) => void;
  setHealthProfile: (patch: Partial<HealthProfile>) => void;
  resetHealth: () => void;
  addJournal: (e: JournalEntry) => void;
  setHints: (h: Signals) => void;
  clearHint: (k: keyof Signals) => void;
  setOracle: (o: OracleState) => void;
  markVisited: (c: ChapterId) => void;
  resetAll: () => void;
}

const emptyEconomy: EconomyState = { txns: [], leaks: [], summary: null, source: null, fileName: null };
const initialHealthResult = computeHealth(DEFAULT_HEALTH_PROFILE);
const initialHealth: HealthState = {
  profile: DEFAULT_HEALTH_PROFILE,
  result: initialHealthResult,
  score: initialHealthResult.score,
  touched: false,
  history: [],
};

const initial = {
  economy: emptyEconomy,
  time: { profile: DEFAULT_TIME_PROFILE, result: computeTimeLoss(DEFAULT_TIME_PROFILE), touched: false },
  effort: { explored: [] as ProductId[], workers: 0, humanHours: 0 },
  health: initialHealth,
  journal: [] as JournalEntry[],
  hints: {} as Signals,
  oracle: { cards: [], generatedAt: null, source: null, fingerprint: null } as OracleState,
  visited: [] as ChapterId[],
};

export const useVestige = create<VestigeState>()(
  persist(
    (set) => ({
      ...initial,

      setEconomy: (economy) => set({ economy }),
      clearEconomy: () => set({ economy: emptyEconomy }),

      setTimeProfile: (patch) =>
        set((s) => {
          const profile = { ...s.time.profile, ...patch };
          return { time: { profile, result: computeTimeLoss(profile), touched: true } };
        }),

      exploreProduct: (id, workers, minutes) =>
        set((s) =>
          s.effort.explored.includes(id)
            ? s
            : {
                effort: {
                  explored: [...s.effort.explored, id],
                  workers: s.effort.workers + workers,
                  humanHours: Math.round((s.effort.humanHours + minutes / 60) * 10) / 10,
                },
              },
        ),

      setHealthProfile: (patch) =>
        set((s) => {
          const profile = { ...s.health.profile, ...patch };
          const result = computeHealth(profile);
          const last = s.health.history[s.health.history.length - 1];
          const history =
            last && last.score === result.score ? s.health.history : [...s.health.history.slice(-29), { at: Date.now(), score: result.score }];
          return { health: { profile, result, score: result.score, touched: true, history } };
        }),
      resetHealth: () => set({ health: initialHealth }),

      addJournal: (e) => set((s) => ({ journal: [...s.journal.slice(-19), e] })),
      setHints: (h) => set((s) => ({ hints: { ...s.hints, ...h } })),
      clearHint: (k) =>
        set((s) => {
          const hints = { ...s.hints };
          delete hints[k];
          return { hints };
        }),

      setOracle: (oracle) => set({ oracle }),
      markVisited: (c) => set((s) => (s.visited.includes(c) ? s : { visited: [...s.visited, c] })),
      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'vestige-state',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        economy: s.economy,
        time: s.time,
        effort: s.effort,
        health: s.health,
        journal: s.journal,
        hints: s.hints,
        oracle: s.oracle,
        visited: s.visited,
      }),
      // Older snapshots (v1) had no health slice — merge defaults in safely.
      migrate: (persisted) => ({ ...initial, ...(persisted as Partial<VestigeState>) }) as VestigeState,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<VestigeState>;
        return {
          ...current,
          ...p,
          time: { ...current.time, ...p.time, profile: { ...current.time.profile, ...p.time?.profile } },
          health: { ...current.health, ...p.health, profile: { ...current.health.profile, ...p.health?.profile } },
        };
      },
    },
  ),
);
