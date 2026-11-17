'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from '@/lib/gsap';
import { useUI } from '@/lib/ui-store';

export function CurtainNavigator() {
  const curtain = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pendingHref = useUI((s) => s.pendingHref);
  const clearPending = useUI((s) => s.clearPending);

  useEffect(() => {
    if (!pendingHref || !curtain.current) return;
    const href = pendingHref;
    clearPending();
    gsap.timeline()
      .set(curtain.current, { display: 'flex', scaleY: 0, transformOrigin: 'bottom' })
      .to(curtain.current, { scaleY: 1, duration: 0.45, ease: 'expo.inOut' })
      .add(() => router.push(href))
      .to(curtain.current, { scaleY: 0, transformOrigin: 'top', duration: 0.45, ease: 'expo.inOut', delay: 0.08 })
      .set(curtain.current, { display: 'none' });
  }, [pendingHref, clearPending, router]);

  return (
    <div
      ref={curtain}
      className="fixed inset-0 z-[10000] hidden items-center justify-center bg-ink"
      aria-hidden="true"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full border border-cy/30 animate-pulse-ring" />
        <div className="w-16 h-16 rounded-full border-2 border-cy/60 flex items-center justify-center">
          <span className="font-display text-cy text-xs tracking-widest">V</span>
        </div>
      </div>
    </div>
  );
}
