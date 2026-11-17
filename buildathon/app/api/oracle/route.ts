import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { fallbackRoadmap, ORACLE_SYSTEM } from '@/lib/oracle';
import { hashString } from '@/lib/format';
import type { OracleCard, OracleContext } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const leakType = z.enum(['subscription', 'micro', 'dynamic', 'fee']);
const factor = z.enum(['sleep', 'hydration', 'movement', 'posture', 'breath']);
const n = z.number().finite();

const ContextSchema = z.object({
  money: z.object({
    hasData: z.boolean(),
    monthlyLeak: n,
    yearlyLeak: n,
    leakShare: n,
    topLeaks: z.array(z.object({ merchant: z.string().max(60), type: leakType, monthly: n })).max(8),
  }),
  time: z.object({
    doomHours: n,
    switchesPerHour: n,
    workHours: n,
    dailyLost: n,
    yearlyLost: n,
    pastDailyLost: n,
  }),
  effort: z.object({
    explored: z.array(z.enum(['phone', 'coffee', 'tshirt', 'package'])).max(4),
    workers: n,
    humanHours: n,
  }),
  health: z.object({
    hasData: z.boolean(),
    score: n,
    pastScore: n,
    sleepHours: n,
    waterGlasses: n,
    sittingHours: n,
    movementMinutes: n,
    weakest: z.array(factor).max(5),
  }),
  intents: z.array(z.string().max(200)).max(10),
});

const CardsSchema = z.object({
  cards: z
    .array(
      z.object({
        year: z.number().int(),
        category: z.enum(['money', 'time', 'human', 'mind', 'body']),
        title: z.string().max(80),
        insight: z.string().max(320),
        action: z.string().max(360),
        metric: z.string().max(40),
        size: z.enum(['sm', 'md', 'lg']),
      }),
    )
    .min(6)
    .max(14),
});

export async function POST(req: Request) {
  let ctx: OracleContext;
  try {
    ctx = ContextSchema.parse(await req.json()) as OracleContext;
  } catch {
    return NextResponse.json({ error: 'Invalid profile payload.' }, { status: 400 });
  }

  const startYear = new Date().getFullYear() + 1;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ cards: fallbackRoadmap(ctx, startYear), source: 'fallback' });
  }

  try {
    const { object } = await generateObject({
      model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
      schema: CardsSchema,
      system: ORACLE_SYSTEM,
      prompt: `Start year: ${startYear}. Currency: INR.\nProfile JSON:\n${JSON.stringify(ctx)}`,
      temperature: 0.7,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(25000),
    });

    const cards: OracleCard[] = object.cards.map((c, i) => ({
      ...c,
      year: Math.min(startYear + 4, Math.max(startYear, c.year)),
      id: hashString(`${c.title}-${i}`),
    }));

    // Guarantee the health mandate even if the model under-delivers.
    if (cards.filter((c) => c.category === 'body').length < 2) {
      const extra = fallbackRoadmap(ctx, startYear).filter((c) => c.category === 'body');
      cards.push(...extra.slice(0, 2));
    }

    return NextResponse.json({ cards, source: 'ai' });
  } catch (err) {
    console.error('[oracle] AI generation failed, using fallback:', err instanceof Error ? err.message : err);
    return NextResponse.json({ cards: fallbackRoadmap(ctx, startYear), source: 'fallback' });
  }
}
