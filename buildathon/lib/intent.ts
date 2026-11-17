// ─────────────────────────────────────────────────────────────
// Deterministic intent engine. Used as:
//   1) the offline router when no AI key is configured,
//   2) a cross-check / fail-safe for the LLM decision,
//   3) a client-side fallback if the API is unreachable.
// Shared by server and client — keep it dependency-free.
// ─────────────────────────────────────────────────────────────
import type { GateDecision, ProductId, RouteTarget, Signals } from './types';
import { clamp, inr } from './format';
import { parseHabitText } from './health-model';

type Rule = readonly [RegExp, number];

export const ROUTES: RouteTarget[] = ['economy', 'time', 'effort', 'health'];

export const ROUTE_PATHS: Record<RouteTarget, string> = {
  economy: '/economy',
  time: '/time',
  effort: '/effort',
  health: '/health',
};

export const ROUTE_LABEL: Record<RouteTarget, string> = {
  economy: 'The Phantom Economy',
  time: 'Cognitive Load',
  effort: 'The Unseen Human Effort',
  health: 'The Silent Health Debt',
};

export const ROUTE_SHORT: Record<RouteTarget, string> = {
  economy: 'Money',
  time: 'Time',
  effort: 'Human effort',
  health: 'Health',
};

const RULES: Record<RouteTarget, Rule[]> = {
  time: [
    [/\b(scroll(ed|ing)?|doom ?scroll\w*)\b/, 3],
    [/\b(insta(gram)?|reels?|tik ?tok|shorts|snap(chat)?|twitter|reddit|facebook|social media|youtube)\b/, 2.5],
    [/\b(binge\w*|watch(ed|ing)?|stream(ed|ing)?|gam(e|es|ing|ed))\b/, 1.5],
    [/\b(procrastinat\w*|distract\w*|focus|wast(ed|ing) (my )?time|notifications?|tabs?|context switch\w*|meetings?|multitask\w*|bored|unproductive)\b/, 2],
    [/\b(for hours|all day|whole day|all night)\b/, 1.5],
    [/\b\d+(\.\d+)?\s*(hours?|hrs?|minutes?|mins?)\b/, 1],
  ],
  economy: [
    [/\b(bought|buy(ing)?|purchas\w*|paid|pay(ing|ment)?|spen[dt]\w*|splurg\w*)\b/, 2.5],
    [/(₹|\brs\.?\s?\d|\binr\b|\brupees?\b|\$\s?\d|\bdollars?\b)/, 3],
    [/\b(subscriptions?|renew\w*|upi|gpay|phonepe|paytm|emi|bills?|rent|credit card|bank|loan|fees?|charges?)\b/, 2.5],
    [/\b(coffee|latte|chai|snacks?|lunch|dinner|uber|ola|rapido|cab|taxi)\b/, 1.5],
    [/\border(ed)?\s+(food|lunch|dinner|biryani|pizza|burger)\b|\b(swiggy|zomato)\b/, 2.5],
    [/\b(sale|discount|deal|offer|cashback|price|expensive|cheap|budget|money|saving)\b/, 2],
  ],
  effort: [
    [/\b(order(ed|ing)?|deliver(ed|y|ing)?|shipp?(ed|ing)|parcel|package|courier|unbox\w*|arriv(ed|al))\b/, 2.5],
    [/\b(amazon|flipkart|myntra|meesho|ajio|nykaa)\b/, 2],
    [/\b(phone|iphone|smartphone|mobile|laptop|headphones?|earbuds?|gadget|t-?shirts?|shirts?|clothes|jeans|shoes|sneakers)\b/, 2],
    [/\b(who made|made by|factory|workers?|labou?r|supply chain|farmers?|miners?|handmade)\b/, 3],
  ],
  health: [
    [/\b(barely slept|didn'?t sleep|no sleep|couldn'?t sleep|insomnia|all-?nighter|slept|sleep(ing|less)?|nap(ped)?)\b/, 3.5],
    [/\b(tired|exhausted|fatigue\w*|drained|burn(ed|t)? ?out|groggy|sleepy)\b/, 2.5],
    [/\b(back|neck|shoulders?|wrists?|eyes?|head)\s*(hurts?|aches?|pain|is killing|sore|strain)\b|\b(back ?ache|headache|migraine|eye strain|stiff|posture|hunch\w*)\b/, 4],
    [/\b(sat|sitting|seated|desk all day|sedentary|didn'?t move)\b/, 2.5],
    [/\b(water|hydrat\w*|dehydrat\w*|thirsty|glass(es)? of)\b/, 3],
    [/\b(gym|workout|exercis\w*|walk(ed)?|steps|yoga|ran|running|stretch\w*|breath\w*|health|body|junk food|skipped (a )?meal)\b/, 2],
  ],
};

export function scoreIntent(text: string): Record<RouteTarget, number> {
  const t = ` ${text.toLowerCase()} `;
  const scores: Record<RouteTarget, number> = { economy: 0, time: 0, effort: 0, health: 0 };
  for (const route of ROUTES) for (const [rx, w] of RULES[route]) if (rx.test(t)) scores[route] += w;
  // Disambiguation: "sat scrolling for hours" → time; "sat for 9 hours" alone → health.
  if (scores.health > 0 && /\b(scroll|insta|reels|youtube|tiktok)/.test(t) && !/\b(slept|sleep|hurts?|pain|water)\b/.test(t))
    scores.health *= 0.6;
  return scores;
}

const PRODUCT_RX: [ProductId, RegExp][] = [
  ['phone', /\b(i?phone|smartphone|mobile)\b/],
  ['coffee', /\b(coffee|latte|cappuccino|espresso|cold brew)\b/],
  ['tshirt', /\b(t-?shirts?|tees?|shirts?|clothes|hoodie|jeans)\b/],
  ['package', /\b(earbuds?|headphones?|airpods|parcel|package|amazon|flipkart|order(ed)?)\b/],
];

export function extractSignals(text: string): Signals {
  const t = text.toLowerCase();
  const s: Signals = {};

  const h = t.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
  if (h) s.hours = clamp(parseFloat(h[1]), 0, 24);
  else {
    const m = t.match(/(\d+)\s*(?:minutes?|mins?)\b/);
    if (m) s.hours = clamp(parseInt(m[1], 10) / 60, 0, 24);
    else if (/\b(for hours|all day|whole day)\b/.test(t)) s.hours = 3;
  }

  const a =
    t.match(/(?:₹|rs\.?|inr)\s*(\d[\d,]*(?:\.\d+)?)/) ?? t.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:rupees?|rs\b|inr|₹)/);
  if (a) {
    const v = parseFloat(a[1].replace(/,/g, ''));
    if (v > 0 && v < 1e7) s.amount = v;
  }

  for (const [id, rx] of PRODUCT_RX)
    if (rx.test(t)) {
      s.product = id;
      break;
    }

  const hp = parseHabitText(text);
  if (hp.sleepHours !== undefined) s.sleepHours = hp.sleepHours;
  if (hp.waterGlasses !== undefined) s.waterGlasses = hp.waterGlasses;
  if (hp.sittingHours !== undefined) s.sittingHours = hp.sittingHours;

  return s;
}

const PRODUCT_NAME: Record<ProductId, string> = {
  phone: 'phone',
  coffee: 'coffee',
  tshirt: 'shirt',
  package: 'parcel',
};

export function routeReply(route: RouteTarget, s: Signals, alternatives: RouteTarget[] = []): string {
  let base: string;
  switch (route) {
    case 'time':
      base = s.hours
        ? `${s.hours} hours. As a habit, that's ${Math.round(s.hours * 365).toLocaleString('en-IN')} hours a year. Let me show you where your attention fractures.`
        : 'Attention leaves no receipt. Let me make the fractures visible.';
      break;
    case 'economy':
      base = s.amount
        ? `${inr(s.amount)} feels small. Daily, it's ${inr(s.amount * 365)} a year. Let's trace the leaks you can't see.`
        : "Money rarely vanishes in one place — it seeps. Let's find the cracks.";
      break;
    case 'effort':
      base = s.product
        ? `Behind that ${PRODUCT_NAME[s.product]} are hundreds of hands you never met. Let me light them up.`
        : 'Every click starts a relay of human hands. Let me show you who carried it.';
      break;
    case 'health':
      base =
        s.sleepHours !== undefined && s.sleepHours < 7
          ? `${s.sleepHours} hours of sleep. Your body just took out a loan it will ask you to repay. Let me show you the ledger.`
          : s.sittingHours
            ? `${s.sittingHours} hours seated. Your spine has been keeping score. Let me render it.`
            : 'Your body keeps a silent ledger of every skipped glass and short night. Let me make it visible.';
      break;
  }
  if (alternatives.length) base += ` I also sensed traces of ${alternatives.map((a) => ROUTE_SHORT[a].toLowerCase()).join(' & ')} — explore those next.`;
  return base;
}

export const CLARIFY_REPLY =
  "I can't trace that to a vestige yet. Was it about money spent, time lost, your body, or something someone made for you?";

export function classifyIntent(text: string): GateDecision {
  const scores = scoreIntent(text);
  const ranked = [...ROUTES].sort((a, b) => scores[b] - scores[a]);
  const [top, second] = ranked;
  const topS = scores[top];
  const secS = scores[second];
  const total = ranked.reduce((acc, k) => acc + scores[k], 0);
  const signals = extractSignals(text);

  if (topS < 1.5 || topS === secS) {
    return {
      route: null,
      confidence: 0,
      reply: CLARIFY_REPLY,
      signals,
      source: 'heuristic',
      alternatives: topS < 1.5 ? [...ROUTES] : ranked.filter((k) => scores[k] === topS),
    };
  }

  const confidence = Math.min(0.97, (topS / total) * Math.min(1, topS / 3));
  const alternatives = ranked.slice(1).filter((k) => scores[k] > 0 && scores[k] >= topS * 0.5);
  return {
    route: top,
    confidence: Math.round(confidence * 100) / 100,
    reply: routeReply(top, signals, alternatives),
    signals,
    source: 'heuristic',
    alternatives,
  };
}

/** Clamp & whitelist signals from any source (LLM output is untrusted). */
export function sanitizeSignals(s: Partial<Record<keyof Signals, unknown>>): Signals {
  const out: Signals = {};
  const n = (v: unknown, min: number, max: number) =>
    typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : undefined;
  const hours = n(s.hours, 0, 24);
  if (hours !== undefined) out.hours = hours;
  const amount = n(s.amount, 0.01, 1e7);
  if (amount !== undefined) out.amount = amount;
  if (typeof s.product === 'string' && ['phone', 'coffee', 'tshirt', 'package'].includes(s.product))
    out.product = s.product as ProductId;
  const sleep = n(s.sleepHours, 0, 14);
  if (sleep !== undefined) out.sleepHours = sleep;
  const water = n(s.waterGlasses, 0, 16);
  if (water !== undefined) out.waterGlasses = water;
  const sit = n(s.sittingHours, 0, 16);
  if (sit !== undefined) out.sittingHours = sit;
  return out;
}
