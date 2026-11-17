'use client';
import { ChapterHero } from '@/components/ui/ChapterHero';
import { useMarkVisited } from '@/lib/hooks';
import { HolographicBody } from './HolographicBody';
import { HabitPanel } from './HabitPanel';
import { HealthRadar } from './HealthRadar';
import { HealthStats } from './HealthStats';
import { MagButton } from '@/components/ui/MagButton';
import { useTransitionNavigate } from '@/lib/hooks';
import { useVestige } from '@/lib/store';

export function HealthPage() {
  useMarkVisited('health');
  const navigate = useTransitionNavigate();
  const score = useVestige(s => s.health.score);

  return (
    <div className="min-h-screen bg-ink">
      <ChapterHero
        index="04"
        title="The Silent Health Debt"
        kicker="Unseen health leaks"
        blurb="Screen apnea, stillness, thirst and short nights — your body keeps a ledger you never see."
        accent="#3dffb5"
      >
        <div className="inline-flex items-center gap-3 mt-2 px-4 py-2 rounded-full border border-bio/20 bg-bio/5">
          <span className="w-2 h-2 rounded-full bg-bio animate-pulse" />
          <span className="font-display text-sm font-semibold text-bio">Health Score: {score}</span>
        </div>
      </ChapterHero>

      <section className="max-w-7xl mx-auto px-4 pb-32 space-y-20">
        {/* Main two-column: body + controls */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <HolographicBody />
          <HabitPanel />
        </div>
        <HealthRadar />
        <HealthStats />
        <div className="text-center">
          <MagButton variant="bio" size="lg" onClick={() => navigate('/convergence')}>
            See your past vs present →
          </MagButton>
        </div>
      </section>
    </div>
  );
}
