'use client';
import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    if (isMobile) return;

    document.body.style.cursor = 'none';
    let ax = 0, ay = 0, cx = 0, cy = 0;
    let raf = 0;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const onMove = (e: MouseEvent) => {
      cx = e.clientX; cy = e.clientY;
      if (dot.current) {
        dot.current.style.transform = `translate(${cx - 4}px, ${cy - 4}px)`;
      }
    };
    const loop = () => {
      ax = lerp(ax, cx, 0.12); ay = lerp(ay, cy, 0.12);
      if (ring.current) ring.current.style.transform = `translate(${ax - 18}px, ${ay - 18}px)`;
      raf = requestAnimationFrame(loop);
    };
    const onOver = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest('a,button,.mag-btn,[data-cursor]');
      if (ring.current) ring.current.style.transform += ' scale(1.8)';
      if (dot.current) dot.current.style.opacity = t ? '0' : '1';
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    loop();
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      cancelAnimationFrame(raf);
      document.body.style.cursor = '';
    };
  }, []);

  return (
    <>
      <div ref={dot} className="pointer-events-none fixed top-0 left-0 z-[9999] w-2 h-2 rounded-full bg-cy will-change-transform" style={{ transition: 'opacity 0.2s' }} />
      <div ref={ring} className="pointer-events-none fixed top-0 left-0 z-[9998] w-9 h-9 rounded-full border border-cy/50 will-change-transform" style={{ transition: 'transform 0.08s linear, opacity 0.2s' }} />
    </>
  );
}
