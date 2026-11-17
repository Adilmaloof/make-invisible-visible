'use client';
import { productById, productTotals } from '@/lib/supply-chains';
import type { ProductId } from '@/lib/types';
import { num } from '@/lib/format';
import { clsx } from 'clsx';

export function StageTimeline({ productId }: { productId: ProductId }) {
  const product = productById(productId);
  const totals = productTotals(product);

  return (
    <div className="rounded-2xl border border-white/8 bg-ink-2/40 p-6 space-y-6">
      <div className="flex flex-wrap gap-6 items-center justify-between">
        <h3 className="font-display font-semibold text-slate-300 text-sm">{product.name} — human supply chain</h3>
        <div className="flex gap-6 text-xs text-slate-500">
          <span style={{ color: product.color }}>{num(totals.people)} people</span>
          <span>{num(totals.minutes)} labour-minutes</span>
          <span>{totals.countries} countries</span>
        </div>
      </div>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="space-y-5 pl-10">
          {product.stages.map((s, i) => (
            <div key={i} className="relative group">
              <div
                className="absolute -left-6 top-2 w-3 h-3 rounded-full border-2 border-ink-2 transition-transform group-hover:scale-125"
                style={{ background: product.color, boxShadow: `0 0 10px ${product.color}66` }}
              />
              <div className="rounded-xl border border-white/5 bg-white/3 p-4 hover:bg-white/5 transition-colors">
                <div className="flex flex-wrap gap-3 items-start justify-between">
                  <div>
                    <p className="font-display font-semibold text-sm" style={{ color: product.color }}>{s.role}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.place}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400">{num(s.people)} workers</p>
                    <p className="text-xs text-slate-600">{s.minutes} min embodied</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
