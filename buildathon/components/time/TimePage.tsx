'use client';
import { ChapterHero } from '@/components/ui/ChapterHero';
import { useMarkVisited } from '@/lib/hooks';
import { TimeInputPanel } from './TimeInputPanel';
import { ShatterCanvas } from './ShatterCanvas';
import { TimeStats } from './TimeStats';
import { MagButton } from '@/components/ui/MagButton';
import { useTransitionNavigate } from '@/lib/hooks';
import { useVestige } from '@/lib/store';

export function TimePage() {
  useMarkVisited('time');
  const navigate = useTransitionNavigate();
  const result = useVestige(s => s.time.result);

  return (
    <div className="min-h-screen bg-ink">
      <ChapterHero
        index="02"
        title="Cognitive Load"
        kicker="Time leaks"
        blurb="Every notification is a fracture. Watch the shards of your attention assemble into lost hours."
        accent="#a855f7"
      />

      <section className="max-w-6xl mx-auto px-4 pb-32 space-y-20">
        <TimeInputPanel />
        <ShatterCanvas />
        <TimeStats />
        <div className="text-center">
          <MagButton variant="vi" size="lg" onClick={() => navigate('/effort')}>
            See who built what you ordered →
          </MagButton>
        </div>
      </section>
    </div>
  );
}
