'use client';
import { useRef, useEffect } from 'react';
import { gsap } from '@/lib/gsap';
import { ChapterNav } from './ChapterNav';
import { ScrollHint } from './ScrollHint';

interface Props {
  index: string;
  title: string;
  kicker: string;
  blurb: string;
  accent?: string;
  children?: React.ReactNode;
}

export function ChapterHero({ index, title, kicker, blurb, accent = '#22f2ff', children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const els = ref.current.querySelectorAll('[data-reveal]');
    gsap.fromTo(els, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'expo.out', delay: 0.1 });
  }, []);
  return (
    <section className="relative min-h-screen flex flex-col">
      <ChapterNav />
      <div ref={ref} className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-16 text-center max-w-3xl mx-auto w-full gap-6">
        <p data-reveal className="chapter-badge" style={{ color: accent }}>{index} · {kicker}</p>
        <h1 data-reveal className="clamp-title font-display font-bold leading-[1.05] tracking-tight" style={{ textShadow: `0 0 60px ${accent}44` }}>
          {title}
        </h1>
        <p data-reveal className="text-slate-400 text-lg leading-relaxed max-w-xl">{blurb}</p>
        {children}
        <div data-reveal className="mt-6"><ScrollHint /></div>
      </div>
    </section>
  );
}
