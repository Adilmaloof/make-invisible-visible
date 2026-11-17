export function ScrollHint({ label = 'Scroll to reveal' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 opacity-50">
      <span className="text-xs tracking-widest uppercase font-display text-slate-400">{label}</span>
      <div className="w-px h-10 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent via-cy to-transparent animate-scroll-hint" />
      </div>
    </div>
  );
}
