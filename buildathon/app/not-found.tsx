'use client';
import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-ink text-slate-300">
      <p className="font-display text-6xl font-bold text-cy glow-cy">404</p>
      <p className="text-lg text-slate-400">This vestige has dissolved.</p>
      <Link href="/" className="mag-btn text-cy border-cy/40 hover:bg-cy/5">Return to origin</Link>
    </main>
  );
}
