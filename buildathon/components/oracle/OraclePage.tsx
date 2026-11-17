'use client';
import { useEffect, useState } from 'react';
import { useVestige } from '@/lib/store';
import { ChapterHero } from '@/components/ui/ChapterHero';
import { useMarkVisited } from '@/lib/hooks';
import { buildOracleContext, contextFingerprint } from '@/lib/oracle';
import { LoadingVeil } from '@/components/ui/LoadingVeil';
import { OracleMasonry } from './OracleMasonry';
import { MagButton } from '@/components/ui/MagButton';
import { useTransitionNavigate } from '@/lib/hooks';
import { withMinDuration } from '@/lib/format';
import type { OracleCard } from '@/lib/types';

export function OraclePage() {
  useMarkVisited('oracle');
  const navigate = useTransitionNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const economy = useVestige(s => s.economy);
  const time = useVestige(s => s.time);
  const effort = useVestige(s => s.effort);
  const health = useVestige(s => s.health);
  const journal = useVestige(s => s.journal);
  const oracle = useVestige(s => s.oracle);
  const setOracle = useVestige(s => s.setOracle);

  const ctx = buildOracleContext({
    summary: economy.summary, leaks: economy.leaks, time: time.profile,
    health: health.profile, healthTouched: health.touched,
    effort, journal,
  });
  const fp = contextFingerprint(ctx);

  const generate = async () => {
    setLoading(true); setError('');
    try {
      const cards: OracleCard[] = await withMinDuration(async () => {
        const res = await fetch('/api/oracle', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(ctx),
          signal: AbortSignal.timeout(28000),
        });
        if (!res.ok) throw new Error('Oracle unavailable');
        const data = await res.json();
        return data.cards as OracleCard[];
      }, 1800);

      setOracle({ cards, generatedAt: Date.now(), source: 'ai', fingerprint: fp });
    } catch (e) {
      setError('The Oracle is momentarily silent. Using the deterministic roadmap.');
      // Fallback is handled inside the API route; if fetch itself failed, re-call in browser
      const { fallbackRoadmap } = await import('@/lib/oracle');
      const cards = fallbackRoadmap(ctx);
      setOracle({ cards, generatedAt: Date.now(), source: 'fallback', fingerprint: fp });
    } finally { setLoading(false); }
  };

  // Auto-generate if stale / never generated
  useEffect(() => {
    if (!oracle.fingerprint || oracle.fingerprint !== fp || !oracle.cards.length) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-ink">
      <LoadingVeil visible={loading} />
      <ChapterHero
        index="06"
        title="The Oracle"
        kicker="Five-year roadmap"
        blurb="Everything you revealed, distilled into a personal roadmap for the next five years."
        accent="#a855f7"
      />
      <section className="max-w-6xl mx-auto px-4 pb-32 space-y-10">
        {error && (
          <div className="text-center p-4 rounded-xl border border-em/20 bg-em/5 text-em text-sm font-display">{error}</div>
        )}
        {oracle.cards.length > 0 ? (
          <>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-slate-500 font-display">
                  {oracle.source === 'ai' ? '✦ AI-generated' : '✦ Deterministic'} · {oracle.cards.length} insights
                </p>
                <h2 className="font-display font-bold text-2xl text-slate-100 mt-1">Your 5-year roadmap</h2>
              </div>
              <MagButton variant="vi" size="sm" onClick={generate}>Regenerate ↺</MagButton>
            </div>
            <OracleMasonry cards={oracle.cards} />
          </>
        ) : !loading && (
          <div className="text-center py-20">
            <p className="text-slate-500 mb-6">The Oracle is ready to read your vestige.</p>
            <MagButton variant="vi" size="lg" onClick={generate}>Summon the Oracle</MagButton>
          </div>
        )}
        <div className="text-center border-t border-white/5 pt-10">
          <MagButton variant="ghost" onClick={() => navigate('/')}>Return to origin ↩</MagButton>
        </div>
      </section>
    </div>
  );
}
