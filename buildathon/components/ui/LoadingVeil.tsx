'use client';
import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';

export function LoadingVeil({ visible }: { visible: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    if (visible) {
      gsap.to(ref.current, { opacity: 1, pointerEvents: 'all', duration: 0.3 });
    } else {
      gsap.to(ref.current, { opacity: 0, pointerEvents: 'none', duration: 0.5, delay: 0.2 });
    }
  }, [visible]);
  return (
    <div ref={ref} className="fixed inset-0 z-[9000] flex flex-col items-center justify-center bg-ink/90 backdrop-blur-sm opacity-0 pointer-events-none">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border border-cy/20 animate-pulse-ring" />
        <div className="absolute inset-0 rounded-full border border-cy/40 animate-pulse-ring" style={{ animationDelay: '0.6s' }} />
        <div className="w-16 h-16 rounded-full border border-cy/60 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-cy animate-ping" />
        </div>
      </div>
      <p className="mt-6 text-xs tracking-widest uppercase font-display text-slate-500 animate-pulse">Analysing…</p>
    </div>
  );
}
