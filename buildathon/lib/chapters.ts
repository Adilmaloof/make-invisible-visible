import type { ChapterId } from './types';

export interface Chapter {
  id: ChapterId;
  href: string;
  index: string;
  title: string;
  kicker: string;
  blurb: string;
  accent: string;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'economy',
    href: '/economy',
    index: '01',
    title: 'The Phantom Economy',
    kicker: 'Financial leaks',
    blurb: 'Micro-payments, forgotten subscriptions and surge pricing — the money that leaves without a sound.',
    accent: '#22f2ff',
  },
  {
    id: 'time',
    href: '/time',
    index: '02',
    title: 'Cognitive Load',
    kicker: 'Time leaks',
    blurb: 'Every notification is a fracture. Watch the shards of your attention assemble into hours.',
    accent: '#a855f7',
  },
  {
    id: 'effort',
    href: '/effort',
    index: '03',
    title: 'The Unseen Human Effort',
    kicker: 'Invisible labour',
    blurb: 'One click. Hundreds of hands. Trace the miners, makers and riders behind what you own.',
    accent: '#ff7a1a',
  },
  {
    id: 'health',
    href: '/health',
    index: '04',
    title: 'The Silent Health Debt',
    kicker: 'Unseen health leaks',
    blurb: 'Screen apnea, stillness, thirst and short nights — the body keeps a ledger you never see.',
    accent: '#3dffb5',
  },
  {
    id: 'convergence',
    href: '/convergence',
    index: '05',
    title: 'The Convergence',
    kicker: 'Past vs present',
    blurb: 'Your past self and present self, plotted on the same axis. The drift becomes undeniable.',
    accent: '#22f2ff',
  },
  {
    id: 'oracle',
    href: '/oracle',
    index: '06',
    title: 'The Oracle',
    kicker: 'Five-year roadmap',
    blurb: 'Everything you revealed, distilled into a personal roadmap for the next five years.',
    accent: '#a855f7',
  },
];

export const chapterByHref = (href: string) => CHAPTERS.find((c) => c.href === href);
export const nextChapter = (id: ChapterId) => {
  const i = CHAPTERS.findIndex((c) => c.id === id);
  return i >= 0 && i < CHAPTERS.length - 1 ? CHAPTERS[i + 1] : null;
};
