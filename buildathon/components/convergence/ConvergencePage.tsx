'use client';
import { ChapterHero } from '@/components/ui/ChapterHero';
import { useMarkVisited } from '@/lib/hooks';
import { DualAxisChart } from './DualAxisChart';
import { ConvergenceStats } from './ConvergenceStats';
import { MagButton } from '@/components/ui/MagButton';
import { useTransitionNavigate } from '@/lib/hooks';

export function ConvergencePage() {
  useMarkVisited('convergence');
  const navigate = useTransitionNavigate();
  return (
    <div className="min-h-screen bg-ink">
      <ChapterHero
        index="05"
        title="The Convergence"
        kicker="Past vs present"
        blurb="Your past self and present self, plotted on the same axis. The drift becomes undeniable."
        accent="#22f2ff"
      />
      <section className="max-w-6xl mx-auto px-4 pb-32 space-y-16">
        <ConvergenceStats />
        <DualAxisChart />
        <div className="text-center">
          <MagButton variant="vi" size="lg" onClick={() => navigate('/oracle')}>
            Consult the Oracle →
          </MagButton>
        </div>
      </section>
    </div>
  );
}
