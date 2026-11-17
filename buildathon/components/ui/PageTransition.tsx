'use client';
import { useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from '@/lib/gsap';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.65, ease: 'expo.out', clearProps: 'all' });
  }, [pathname]);

  return <div ref={ref} className="will-change-transform">{children}</div>;
}
