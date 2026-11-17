'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useVestige } from './store';
import { useUI } from './ui-store';
import type { ChapterId } from './types';

/** True once the persisted store has rehydrated on the client (avoids SSR mismatches). */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useVestige.persist.onFinishHydration(() => setHydrated(true));
    if (useVestige.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}

/** Navigates through the curtain transition. */
export function useTransitionNavigate() {
  const pathname = usePathname();
  const navigate = useUI((s) => s.navigate);
  return useCallback(
    (href: string) => {
      if (href === pathname) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      navigate(href);
    },
    [navigate, pathname],
  );
}

export function useMarkVisited(id: ChapterId) {
  const mark = useVestige((s) => s.markVisited);
  useEffect(() => {
    mark(id);
  }, [id, mark]);
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}
