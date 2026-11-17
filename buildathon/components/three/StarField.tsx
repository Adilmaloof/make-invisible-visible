'use client';
import { useRef, useEffect } from 'react';

export function StarField() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const COUNT = 220;
    const stars = Array.from({ length: COUNT }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      r: Math.random() * 1.1 + 0.2,
      a: Math.random(),
      speed: Math.random() * 0.0004 + 0.0001,
      phase: Math.random() * Math.PI * 2,
    }));

    let raf: number;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const s of stars) {
        const alpha = (Math.sin(t * s.speed * 1000 + s.phase) * 0.5 + 0.5) * 0.6 + 0.1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226,232,240,${alpha.toFixed(2)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvas} className="fixed inset-0 pointer-events-none" aria-hidden />;
}
