'use client';
import { PRODUCTS } from '@/lib/supply-chains';
import { clsx } from 'clsx';
import type { ProductId } from '@/lib/types';

interface Props { active: ProductId; onChange: (id: ProductId) => void; }

export function ProductSelector({ active, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {PRODUCTS.map(p => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={clsx(
            'rounded-2xl border p-5 text-left transition-all duration-300 cursor-none',
            active === p.id
              ? 'border-opacity-60 bg-opacity-10 shadow-lg'
              : 'border-white/8 bg-white/2 hover:bg-white/5 hover:border-white/15',
          )}
          style={active === p.id ? { borderColor: p.color + '66', background: p.color + '0d', boxShadow: `0 0 40px ${p.color}18` } : {}}
        >
          <div className="text-3xl mb-3" style={{ color: active === p.id ? p.color : '#475569' }}>{p.glyph}</div>
          <p className="font-display font-semibold text-sm" style={{ color: active === p.id ? p.color : '#94a3b8' }}>{p.name}</p>
          <p className="text-xs text-slate-600 mt-1 leading-snug">{p.tagline}</p>
        </button>
      ))}
    </div>
  );
}
