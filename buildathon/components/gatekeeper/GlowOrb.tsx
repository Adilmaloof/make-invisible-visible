'use client';
import { useRef, useEffect } from 'react';
import { gsap } from '@/lib/gsap';
import { useUI } from '@/lib/ui-store';

type Phase = 'idle' | 'thinking' | 'decided' | 'clarify';

const PHASE_COLORS: Record<Phase, string> = {
  idle: '#22f2ff',
  thinking: '#a855f7',
  decided: '#3dffb5',
  clarify: '#ff7a1a',
};

export function GlowOrb({ phase }: { phase: Phase }) {
  const orbRef = useRef<HTMLDivElement>(null);
  const color = PHASE_COLORS[phase];
  const energy = useUI(s => s.energy);

  useEffect(() => {
    if (!orbRef.current) return;
    // Note: GSAP cannot animate CSS variables natively; set directly and animate other props
    orbRef.current.style.setProperty('--glow-color', color);
    gsap.to(orbRef.current, {
      scale: 1 + energy * 0.25,
      duration: 0.8,
      ease: 'elastic.out(1, 0.4)',
    });
  }, [phase, color, energy]);

  return (
    <div ref={orbRef} className="relative w-24 h-24 flex items-center justify-center" style={{ '--glow-color': color } as React.CSSProperties}>
      <div className="absolute inset-0 rounded-full border border-current/20 animate-pulse-ring" style={{ color }} />
      <div className="absolute inset-0 rounded-full border border-current/10 animate-pulse-ring" style={{ color, animationDelay: '0.9s' }} />
      <div className="absolute inset-4 rounded-full border border-current/40" style={{ color, boxShadow: `0 0 40px ${color}44, inset 0 0 20px ${color}11` }} />
      <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 0 20px ${color}` }}>
        {phase === 'thinking' && <div className="w-full h-full rounded-full animate-ping" style={{ background: color }} />}
      </div>
    </div>
  );
}
