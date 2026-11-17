'use client';
import { useEffect, useRef } from 'react';
import { useVestige } from '@/lib/store';
import { LEAK_META } from '@/lib/analysis';

interface Node { id: string; x: number; y: number; r: number; color: string; label: string; amount: number; vx: number; vy: number; }

export function LeakNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { leaks } = useVestige(s => s.economy);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !leaks.length) return;
    const ctx = c.getContext('2d')!;
    const W = c.offsetWidth; const H = 320;
    c.width = W; c.height = H;

    const max = Math.max(...leaks.map(l => l.monthly));
    const nodes: Node[] = leaks.slice(0, 18).map((l, i) => {
      const angle = (i / leaks.slice(0, 18).length) * Math.PI * 2;
      const dist = 100 + Math.random() * 60;
      return {
        id: l.id, label: l.merchant.slice(0, 10),
        x: W / 2 + Math.cos(angle) * dist,
        y: H / 2 + Math.sin(angle) * dist,
        r: 8 + (l.monthly / max) * 22,
        color: LEAK_META[l.type].color,
        amount: l.monthly, vx: 0, vy: 0,
      };
    });

    // Centre hub
    const hub = { x: W / 2, y: H / 2 };

    let raf: number;
    let t = 0;
    const draw = () => {
      t += 0.01;
      ctx.clearRect(0, 0, W, H);
      // Draw connections with animated dash
      ctx.setLineDash([4, 8]);
      ctx.lineDashOffset = -t * 20;
      for (const n of nodes) {
        const alpha = 0.15 + 0.1 * Math.sin(t + n.amount);
        ctx.beginPath();
        ctx.moveTo(hub.x, hub.y);
        ctx.lineTo(n.x, n.y);
        ctx.strokeStyle = n.color + '44';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Particle along the line
        const frac = (Math.sin(t * 0.8 + n.amount * 0.1) * 0.5 + 0.5);
        const px = hub.x + (n.x - hub.x) * frac;
        const py = hub.y + (n.y - hub.y) * frac;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
        void alpha;
      }
      ctx.setLineDash([]);
      // Hub
      const grad = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, 20);
      grad.addColorStop(0, '#22f2ff33'); grad.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(hub.x, hub.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();
      ctx.beginPath(); ctx.arc(hub.x, hub.y, 20, 0, Math.PI * 2);
      ctx.strokeStyle = '#22f2ff66'; ctx.lineWidth = 1; ctx.stroke();

      // Nodes
      for (const n of nodes) {
        const wobble = Math.sin(t * 1.2 + n.amount) * 2;
        const g = ctx.createRadialGradient(n.x, n.y + wobble, 0, n.x, n.y + wobble, n.r);
        g.addColorStop(0, n.color + 'aa'); g.addColorStop(1, n.color + '11');
        ctx.beginPath(); ctx.arc(n.x, n.y + wobble, n.r, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y + wobble, n.r, 0, Math.PI * 2);
        ctx.strokeStyle = n.color + '88'; ctx.lineWidth = 1; ctx.stroke();
        // Label
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + wobble + n.r + 12);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [leaks]);

  return (
    <div className="rounded-2xl border border-white/8 bg-ink-2/40 p-6 overflow-hidden">
      <h3 className="font-display font-semibold text-slate-300 text-sm mb-4">Leak network — flowing money</h3>
      <canvas ref={canvasRef} className="w-full" style={{ height: 320 }} />
    </div>
  );
}
