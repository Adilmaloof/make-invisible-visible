'use client';

import { create } from 'zustand';

// Transient, non-persisted UI state (transitions, cursor, WebGL energy).
interface UIState {
  pendingHref: string | null;
  /** 0..1 — how "excited" the Gatekeeper nebula is (typing, thinking) */
  energy: number;
  navigate: (href: string) => void;
  clearPending: () => void;
  pulse: (amount?: number) => void;
  setEnergy: (v: number) => void;
}

export const useUI = create<UIState>()((set) => ({
  pendingHref: null,
  energy: 0,
  navigate: (href) => set({ pendingHref: href }),
  clearPending: () => set({ pendingHref: null }),
  pulse: (amount = 0.25) => set((s) => ({ energy: Math.min(1, s.energy + amount) })),
  setEnergy: (v) => set({ energy: Math.max(0, Math.min(1, v)) }),
}));
