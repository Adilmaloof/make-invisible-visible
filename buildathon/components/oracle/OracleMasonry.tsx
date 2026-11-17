'use client';
import { useRef, useEffect } from 'react';
import { gsap } from '@/lib/gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { OracleCard, OracleCategory } from '@/lib/types';
import { clsx } from 'clsx';

const CAT_STYLE: Record<OracleCategory, { accent: string; icon: string; label: string }> = {
  money:  { accent: '#22f2ff', icon: '◈', label: 'Money' },
  time:   { accent: '#a855f7', icon: '◎', label: 'Time' },
  mind:   { accent: '#a855f7', icon: '◉', label: 'Mind' },
  human:  { accent: '#ff7a1a', icon: '◩', label: 'Human' },
  body:   { accent: '#3dffb5', icon: '◒', label: 'Body' },
};

const SIZE_CLASS = { sm: 'md:col-span-1', md: 'md:col-span-1', lg: 'md:col-span-2' };
const SIZE_HEIGHT = { sm: 'min-h-[180px]', md: 'min-h-[220px]', lg: 'min-h-[200px]' };

export function OracleMasonry({ cards }: { cards: OracleCard[] }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      refs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(el,
          { opacity: 0, y: 40, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: 0.7, ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
            delay: (i % 3) * 0.08,
          }
        );
      });
    });
    return () => ctx.revert();
  }, [cards]);

  // Group by year
  const years = [...new Set(cards.map(c => c.year))].sort();

  return (
    <div className="space-y-14">
      {years.map(year => {
        const yearCards = cards.filter(c => c.year === year);
        return (
          <div key={year}>
            <div className="flex items-center gap-4 mb-6">
              <span className="font-display font-bold text-3xl text-vi/40">{year}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-vi/20 to-transparent" />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {yearCards.map((card, i) => {
                const style = CAT_STYLE[card.category];
                return (
                  <div
                    key={card.id}
                    ref={el => { refs.current[cards.indexOf(card)] = el; }}
                    className={clsx('rounded-2xl border p-5 flex flex-col gap-3 transition-transform hover:-translate-y-0.5 duration-300', SIZE_CLASS[card.size], SIZE_HEIGHT[card.size])}
                    style={{ borderColor: style.accent + '33', background: `linear-gradient(135deg, ${style.accent}0a 0%, #05060a 100%)` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xl" style={{ color: style.accent }}>{style.icon}</span>
                      <span className="chapter-badge" style={{ color: style.accent }}>{style.label}</span>
                    </div>
                    <h3 className="font-display font-bold text-slate-200 leading-tight" style={{ fontSize: card.size === 'lg' ? '1.15rem' : '0.95rem' }}>
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed flex-1">{card.insight}</p>
                    <div className="rounded-xl bg-black/30 p-3 space-y-1">
                      <p className="text-xs text-slate-400 leading-relaxed">{card.action}</p>
                      {card.metric && (
                        <p className="font-display font-bold text-sm mt-1" style={{ color: style.accent }}>{card.metric}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
