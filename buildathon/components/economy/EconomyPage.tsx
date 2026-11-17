'use client';
import { useRef } from 'react';
import { ChapterHero } from '@/components/ui/ChapterHero';
import { useMarkVisited } from '@/lib/hooks';
import { UploadZone } from './UploadZone';
import { LeakDashboard } from './LeakDashboard';
import { useVestige } from '@/lib/store';
import { MagButton } from '@/components/ui/MagButton';
import { useTransitionNavigate } from '@/lib/hooks';

export function EconomyPage() {
  useMarkVisited('economy');
  const summary = useVestige(s => s.economy.summary);
  const navigate = useTransitionNavigate();

  return (
    <div className="min-h-screen bg-ink">
      <ChapterHero
        index="01"
        title="The Phantom Economy"
        kicker="Financial leaks"
        blurb="Micro-payments, forgotten subscriptions and surge pricing — the money that leaves without a sound."
        accent="#22f2ff"
      />
      <section className="max-w-6xl mx-auto px-4 pb-32 space-y-16">
        <UploadZone />
        {summary && <LeakDashboard />}
        {summary && (
          <div className="text-center pt-8">
            <MagButton variant="cy" size="lg" onClick={() => navigate('/time')}>
              Explore time leaks →
            </MagButton>
          </div>
        )}
      </section>
    </div>
  );
}
