'use client';
import { CHAPTERS } from '@/lib/chapters';
import { useVestige } from '@/lib/store';
import { scoreTone } from '@/lib/health-model';
import { useTransitionNavigate } from '@/lib/hooks';
import { clsx } from 'clsx';

const ACCENT: Record<string, string> = {
  economy: '#22f2ff',
  time: '#a855f7',
  effort: '#ff7a1a',
  health: '#3dffb5',
  convergence: '#22f2ff',
  oracle: '#a855f7',
};

export function ChapterNav() {
  const visited = useVestige((s) => s.visited);
  const healthScore = useVestige((s) => s.health.score);
  const { color: healthColor } = scoreTone(healthScore);
  const navigate = useTransitionNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-ink/70 border-b border-white/5">
      <button
        onClick={() => navigate('/')}
        className="font-display font-bold text-sm tracking-widest text-cy hover:glow-cy transition-all"
      >
        VESTIGE
      </button>

      <ol className="flex items-center gap-1 overflow-x-auto max-w-[60vw] sm:max-w-none">
        {CHAPTERS.map((c) => {
          const done = visited.includes(c.id);
          return (
            <li key={c.id}>
              <button
                onClick={() => navigate(c.href)}
                title={`${c.index} · ${c.title}`}
                className={clsx(
                  'px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-display font-semibold tracking-wider transition-all duration-300 flex items-center gap-1.5',
                  done
                    ? 'text-slate-200 bg-white/8 hover:bg-white/12'
                    : 'text-slate-500 hover:text-slate-300',
                )}
                style={done ? { color: ACCENT[c.id], textShadow: `0 0 12px ${ACCENT[c.id]}55` } : {}}
              >
                <span>{c.index}</span>
                <span className="hidden lg:inline text-[11px] font-normal opacity-80">{c.kicker}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/health')}
          title="Global Health Score"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-display font-semibold transition-all"
          style={{ borderColor: `${healthColor}44`, background: `${healthColor}10`, color: healthColor }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: healthColor }} />
          <span>HP {healthScore}</span>
        </button>
        <button
          onClick={() => navigate('/oracle')}
          className="text-xs font-display font-semibold text-vi/80 hover:text-vi tracking-wider transition-colors"
        >
          Oracle →
        </button>
      </div>
    </nav>
  );
}
