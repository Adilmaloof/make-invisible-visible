interface Props {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  large?: boolean;
}
export function StatCard({ label, value, sub, accent = '#22f2ff', large }: Props) {
  return (
    <div className="rounded-2xl border border-white/8 bg-ink-2/60 p-6 backdrop-blur-sm flex flex-col gap-1">
      <p className="text-xs uppercase tracking-widest font-display text-slate-500">{label}</p>
      <p className={`font-display font-bold ${large ? 'text-4xl' : 'text-2xl'}`} style={{ color: accent }}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}
