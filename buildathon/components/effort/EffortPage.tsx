'use client';
import { ChapterHero } from '@/components/ui/ChapterHero';
import { useMarkVisited } from '@/lib/hooks';
import { ProductSelector } from './ProductSelector';
import { GlobeScene } from './GlobeScene';
import { StageTimeline } from './StageTimeline';
import { MagButton } from '@/components/ui/MagButton';
import { useTransitionNavigate } from '@/lib/hooks';
import { useVestige } from '@/lib/store';
import { num } from '@/lib/format';
import { useState } from 'react';
import type { ProductId } from '@/lib/types';

export function EffortPage() {
  useMarkVisited('effort');
  const navigate = useTransitionNavigate();
  const [activeProduct, setActiveProduct] = useState<ProductId>('phone');
  const effort = useVestige(s => s.effort);

  return (
    <div className="min-h-screen bg-ink">
      <ChapterHero
        index="03"
        title="The Unseen Human Effort"
        kicker="Invisible labour"
        blurb="One click starts a relay of hundreds of hands. Trace the miners, makers and riders behind what you own."
        accent="#ff7a1a"
      />
      <section className="max-w-6xl mx-auto px-4 pb-32 space-y-16">
        <ProductSelector active={activeProduct} onChange={setActiveProduct} />
        <GlobeScene productId={activeProduct} />
        <StageTimeline productId={activeProduct} />
        {effort.explored.length > 0 && (
          <div className="rounded-2xl border border-em/20 bg-em/5 p-6 flex flex-wrap gap-6 items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-display uppercase tracking-wider mb-1">Your total</p>
              <p className="font-display font-bold text-2xl text-em">{num(effort.workers)} people</p>
              <p className="text-xs text-slate-500 mt-0.5">touched {effort.explored.length} of your products</p>
            </div>
            <div>
              <p className="font-display font-bold text-2xl text-em">{effort.humanHours} h</p>
              <p className="text-xs text-slate-500">embodied human labour-hours</p>
            </div>
            <MagButton variant="em" size="lg" onClick={() => navigate('/health')}>
              Explore your health debt →
            </MagButton>
          </div>
        )}
        {effort.explored.length === 0 && (
          <div className="text-center">
            <MagButton variant="em" size="lg" onClick={() => navigate('/health')}>
              Explore your health debt →
            </MagButton>
          </div>
        )}
      </section>
    </div>
  );
}
