'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVestige } from '@/lib/store';
import { useUI } from '@/lib/ui-store';
import { classifyIntent } from '@/lib/intent';
import { MagButton } from '@/components/ui/MagButton';
import { GlowOrb } from './GlowOrb';
import { ROUTE_PATHS, ROUTE_LABEL } from '@/lib/intent';
import type { GateDecision, RouteTarget } from '@/lib/types';

type Phase = 'idle' | 'thinking' | 'decided' | 'clarify';

const PROMPTS = [
  'What did you do today?',
  'Tell me about your day…',
  'What felt invisible today?',
  'What slipped by unnoticed?',
];

const ALT_LABELS: Record<RouteTarget, string> = {
  economy: '💸 Money',
  time: '⏳ Time',
  effort: '🤲 Human effort',
  health: '🫀 Health',
};

export function Gatekeeper() {
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [decision, setDecision] = useState<GateDecision | null>(null);
  const [promptIdx, setPromptIdx] = useState(0);
  const [error, setError] = useState('');
  const addJournal = useVestige((s) => s.addJournal);
  const setHints = useVestige((s) => s.setHints);
  const setHealthProfile = useVestige((s) => s.setHealthProfile);
  const navigate = useUI((s) => s.navigate);
  const setEnergy = useUI((s) => s.setEnergy);
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setInterval(() => setPromptIdx(i => (i + 1) % PROMPTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const submit = useCallback(async () => {
    const text = input.trim();
    if (!text || phase === 'thinking') return;
    if (text.length < 3) { setError('Tell me a bit more…'); return; }
    setError('');
    setPhase('thinking');
    setEnergy(0.8);

    let dec: GateDecision;
    try {
      const res = await fetch('/api/gatekeeper', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error('API error');
      dec = await res.json();
    } catch {
      dec = classifyIntent(text);
      dec = { ...dec, source: 'heuristic' };
    }

    addJournal({ text, route: dec.route, confidence: dec.confidence, source: dec.source, at: Date.now() });
    if (dec.signals) {
      setHints(dec.signals);
      // Pre-populate health profile from extracted signals
      const hp: Record<string, number> = {};
      if (dec.signals.sleepHours !== undefined) hp.sleepHours = dec.signals.sleepHours;
      if (dec.signals.waterGlasses !== undefined) hp.waterGlasses = dec.signals.waterGlasses;
      if (dec.signals.sittingHours !== undefined) hp.sittingHours = dec.signals.sittingHours;
      if (Object.keys(hp).length) setHealthProfile(hp);
    }

    setDecision(dec);
    setPhase(dec.route ? 'decided' : 'clarify');
    setEnergy(dec.route ? 0.95 : 0.4);
  }, [input, phase, addJournal, setHints, setHealthProfile, navigate, setEnergy]);

  const go = useCallback((route: RouteTarget) => {
    setEnergy(1);
    setTimeout(() => navigate(ROUTE_PATHS[route]), 80);
  }, [navigate, setEnergy]);

  const reset = () => { setInput(''); setPhase('idle'); setDecision(null); setError(''); setEnergy(0); inputRef.current?.focus(); };

  return (
    <div className="relative z-10 w-full max-w-2xl mx-auto px-4 flex flex-col items-center gap-8">
      {/* Logo */}
      <div className="text-center space-y-2">
        <h1 className="font-display font-bold text-5xl md:text-7xl tracking-tight text-slate-100 glow-cy">
          VESTIGE
        </h1>
        <p className="text-slate-500 text-sm tracking-[0.25em] uppercase font-display">
          Make the Invisible Visible
        </p>
      </div>

      {/* Orb */}
      <GlowOrb phase={phase} />

      {/* Input card */}
      <div className="w-full rounded-2xl border border-white/8 bg-ink-2/80 backdrop-blur-xl p-6 space-y-4 shadow-[0_0_80px_#22f2ff08]">
        {phase === 'idle' || phase === 'thinking' ? (
          <>
            <label className="text-slate-400 text-sm font-display block transition-all duration-500">
              {PROMPTS[promptIdx]}
            </label>
            <textarea
              ref={inputRef}
              rows={3}
              value={input}
              onChange={e => { setInput(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="e.g. Scrolled Instagram for 3 hours, ordered Swiggy twice, only slept 5 hours…"
              disabled={phase === 'thinking'}
              className="w-full bg-transparent resize-none text-slate-200 placeholder:text-slate-600 text-sm leading-relaxed focus:outline-none font-sans"
            />
            {error && <p className="text-fe text-xs font-display">{error}</p>}
            <div className="flex items-center justify-between">
              <span className="text-slate-600 text-xs">{input.length}/500</span>
              <MagButton onClick={submit} disabled={phase === 'thinking'} variant="cy">
                {phase === 'thinking' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-cy/50 border-t-cy animate-spin inline-block" />
                    Reading your day…
                  </span>
                ) : 'Reveal →'}
              </MagButton>
            </div>
          </>
        ) : phase === 'decided' && decision?.route ? (
          <div className="space-y-5">
            <p className="text-slate-300 leading-relaxed text-sm">{decision.reply}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => go(decision.route!)}
                className="flex-1 rounded-xl border border-cy/30 bg-cy/5 hover:bg-cy/10 text-cy font-display font-semibold text-sm py-3 px-4 transition-all hover:shadow-[0_0_20px_#22f2ff22]"
              >
                → {ROUTE_LABEL[decision.route]}
              </button>
              <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 px-3 transition-colors">
                Try again
              </button>
            </div>
            {decision.alternatives.length > 0 && (
              <div className="pt-2 border-t border-white/5">
                <p className="text-xs text-slate-600 mb-2 font-display">Also explore</p>
                <div className="flex flex-wrap gap-2">
                  {decision.alternatives.map(a => (
                    <button key={a} onClick={() => go(a)} className="text-xs px-3 py-1 rounded-full border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 transition-all">
                      {ALT_LABELS[a]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* clarify */
          <div className="space-y-4">
            <p className="text-slate-300 text-sm leading-relaxed">{decision?.reply}</p>
            <p className="text-slate-500 text-xs">Choose a chapter to explore:</p>
            <div className="grid grid-cols-2 gap-2">
              {(['economy', 'time', 'effort', 'health'] as RouteTarget[]).map(r => (
                <button key={r} onClick={() => go(r)} className="rounded-xl border border-white/8 bg-white/3 hover:bg-white/6 text-slate-300 text-xs py-2.5 px-3 font-display transition-all text-left">
                  {ALT_LABELS[r]}
                </button>
              ))}
            </div>
            <button onClick={reset} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">← Try different words</button>
          </div>
        )}
      </div>

      {/* Quick links */}
      {phase === 'idle' && (
        <div className="flex flex-wrap gap-3 justify-center">
          {(['economy', 'time', 'effort', 'health'] as RouteTarget[]).map(r => (
            <button key={r} onClick={() => navigate(ROUTE_PATHS[r])} className="text-xs text-slate-600 hover:text-slate-400 font-display tracking-wider transition-colors">
              {ALT_LABELS[r]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
