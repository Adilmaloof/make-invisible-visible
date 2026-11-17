'use client';
import { useRef, useEffect } from 'react';
import { useVestige } from '@/lib/store';
import { useGSAP, gsap, ScrollTrigger } from '@/lib/gsap';
import { num } from '@/lib/format';

interface Shard {
  x: number; y: number;
  tx: number; ty: number; // target (assembled) position
  sx: number; sy: number; // start (shattered) position
  w: number; h: number;
  rotation: number;
  progress: number; // 0=shattered, 1=assembled
}

export function ShatterCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const result = useVestige(s => s.time.result);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const W = c.offsetWidth; const H = 400;
    c.width = W; c.height = H;

    const COLS = 12; const ROWS = 8;
    const sw = W / COLS; const sh = H / ROWS;
    const shards: Shard[] = [];

    for (let r = 0; r < ROWS; r++) {
      for (let col = 0; col < COLS; col++) {
        const tx = col * sw; const ty = r * sh;
        const offset = 300 + Math.random() * 400;
        const angle = Math.random() * Math.PI * 2;
        shards.push({
          x: W / 2 + Math.cos(angle) * offset,
          y: H / 2 + Math.sin(angle) * offset,
          tx, ty, sx: W / 2 + Math.cos(angle) * offset, sy: H / 2 + Math.sin(angle) * offset,
          w: sw, h: sh, rotation: (Math.random() - 0.5) * Math.PI * 1.2, progress: 0,
        });
      }
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    let raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const s of shards) {
        const p = s.progress;
        const cx = lerp(s.sx, s.tx + s.w / 2, p);
        const cy = lerp(s.sy, s.ty + s.h / 2, p);
        const rot = s.rotation * (1 - p);
        const alpha = 0.1 + p * 0.7;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.globalAlpha = alpha;
        const hue = Math.round(p * 100);
        ctx.fillStyle = `hsl(${260 + hue * 0.4},70%,${30 + p * 30}%)`;
        ctx.strokeStyle = `rgba(168,85,247,${0.3 + p * 0.4})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.rect(-s.w / 2 + 1, -s.h / 2 + 1, s.w - 2, s.h - 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Centre number overlay when mostly assembled
      const avg = shards.reduce((s, x) => s + x.progress, 0) / shards.length;
      if (avg > 0.3) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, (avg - 0.3) / 0.7);
        ctx.font = `bold ${Math.round(60 + avg * 60)}px 'Space Grotesk', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(168,85,247,${avg})`;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 40;
        ctx.fillText(`${num(result.yearlyLostHours)} h`, W / 2, H / 2);
        ctx.font = `500 16px 'Inter', sans-serif`;
        ctx.fillStyle = `rgba(148,163,184,${avg * 0.8})`;
        ctx.shadowBlur = 0;
        ctx.fillText('lost per year', W / 2, H / 2 + 48);
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    // Scroll trigger to assemble shards
    const st = ScrollTrigger.create({
      trigger: wrapRef.current,
      start: 'top 80%',
      end: 'bottom 20%',
      scrub: 1.5,
      onUpdate: self => {
        const p = self.progress;
        for (const s of shards) s.progress = Math.min(1, p * 1.6);
      },
    });

    return () => { cancelAnimationFrame(raf); st.kill(); };
  }, [result.yearlyLostHours]);

  return (
    <div ref={wrapRef} className="rounded-2xl border border-white/8 bg-ink-2/40 p-6 overflow-hidden">
      <h3 className="font-display font-semibold text-slate-300 text-sm mb-4">
        Scroll to assemble your lost time
      </h3>
      <canvas ref={canvasRef} className="w-full rounded-xl" style={{ height: 400 }} />
    </div>
  );
}
