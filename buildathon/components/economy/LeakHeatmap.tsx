'use client';

import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useVestige } from '@/lib/store';
import { bucketLabel, inr } from '@/lib/format';
import { LEAK_META } from '@/lib/analysis';
import type { Leak, LeakType } from '@/lib/types';
import { clsx } from 'clsx';

const colHelper = createColumnHelper<Leak>();

export function LeakHeatmap() {
  const { leaks, summary } = useVestige((s) => s.economy);
  const [filter, setFilter] = useState<LeakType | 'all'>('all');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'monthly', desc: true }]);
  const [hovered, setHovered] = useState<{ merchant: string; bucket: string; amount: number; note: string } | null>(null);

  const buckets = summary?.buckets ?? [];
  const filteredLeaks = useMemo(
    () => (filter === 'all' ? leaks : leaks.filter((l) => l.type === filter)).slice(0, 16),
    [leaks, filter],
  );
  const maxV = useMemo(() => Math.max(1, ...leaks.flatMap((l) => Object.values(l.byBucket))), [leaks]);

  const columns = useMemo(
    () => [
      colHelper.accessor('merchant', {
        id: 'merchant',
        header: 'Merchant',
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-2 pr-3 max-w-[148px]" title={`${row.merchant} · ${row.note}`}>
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: LEAK_META[row.type].color, boxShadow: `0 0 8px ${LEAK_META[row.type].color}` }}
              />
              <span className="font-display text-slate-300 truncate">{row.merchant}</span>
            </div>
          );
        },
      }),
      ...buckets.map((b) =>
        colHelper.accessor((row) => row.byBucket[b] ?? 0, {
          id: `bucket_${b}`,
          header: () => bucketLabel(b),
          cell: (info) => {
            const v = info.getValue();
            const row = info.row.original;
            const heat = maxV ? v / maxV : 0;
            const color = LEAK_META[row.type].color;
            const opacity = v ? Math.min(0.92, 0.16 + heat * 0.78) : 0;
            return (
              <div
                onMouseEnter={() => setHovered({ merchant: row.merchant, bucket: bucketLabel(b), amount: v, note: row.note })}
                onMouseLeave={() => setHovered(null)}
                className="rounded-md mx-auto transition-transform duration-150 hover:scale-110 cursor-pointer flex items-center justify-center"
                style={{
                  width: 46,
                  height: 28,
                  background: v ? color : 'transparent',
                  opacity: v ? opacity : 1,
                  border: v ? `1px solid ${color}55` : '1px solid rgba(255,255,255,0.04)',
                  boxShadow: v && heat > 0.45 ? `0 0 12px ${color}44` : 'none',
                }}
              />
            );
          },
        }),
      ),
      colHelper.accessor('monthly', {
        id: 'monthly',
        header: 'Monthly',
        cell: (info) => (
          <span
            className="font-display font-semibold text-right block pl-2"
            style={{ color: LEAK_META[info.row.original.type].color }}
          >
            {inr(info.getValue())}
          </span>
        ),
      }),
    ],
    [buckets, maxV],
  );

  const table = useReactTable({
    data: filteredLeaks,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!summary || !leaks.length) return null;

  return (
    <div className="rounded-2xl border border-white/8 bg-ink-2/40 p-6 space-y-5 overflow-x-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-slate-200 text-sm">Interactive TanStack Leak Heatmap</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Click column headers to sort · Hover cells to inspect unseen expenses
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'subscription', 'dynamic', 'micro', 'fee'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={clsx(
                'px-2.5 py-1 rounded-full text-[11px] font-display transition-all border',
                filter === t
                  ? 'border-cy/50 bg-cy/10 text-cy'
                  : 'border-white/8 text-slate-500 hover:text-slate-300',
              )}
            >
              {t === 'all' ? 'All leaks' : LEAK_META[t].label}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full text-xs border-separate border-spacing-1" style={{ minWidth: 540 }}>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={clsx(
                      'text-slate-500 hover:text-slate-300 font-display font-normal pb-2 cursor-pointer select-none transition-colors',
                      header.id === 'merchant' ? 'text-left pr-3 w-36' : header.id === 'monthly' ? 'text-right pl-2' : 'text-center min-w-[50px]',
                    )}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {sorted === 'asc' ? ' ↑' : sorted === 'desc' ? ' ↓' : ''}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-white/[0.02]">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="py-0.5">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="h-6 flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-3 font-display">
        {hovered ? (
          <span>
            <strong className="text-slate-200">{hovered.merchant}</strong> · {hovered.bucket}:{' '}
            <strong className="text-cy">{hovered.amount ? inr(hovered.amount) : 'No leak'}</strong> —{' '}
            <span className="text-slate-500">{hovered.note}</span>
          </span>
        ) : (
          <span className="text-slate-600">Hover any heatmap cell to inspect merchant leak intensity</span>
        )}
      </div>
    </div>
  );
}
