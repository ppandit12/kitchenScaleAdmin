import { useState, type ReactNode } from 'react';
import { ChartColumn, Table2 } from 'lucide-react';
import type { TooltipPayload } from 'recharts';
import { DemoBadge } from '@/components/common';
import { cn } from '@/utils';

/**
 * Chart tokens for the admin dashboard.
 * Categorical slots were validated with the dataviz palette checker (lightness band, chroma floor,
 * CVD separation, normal-vision floor, 3:1 contrast on white — all pairs pass). Assign in this
 * fixed order; never cycle. Single-series charts use the brand primary.
 */
export const CHART = {
  single: '#D94E12',
  singleWash: 'rgba(217, 78, 18, 0.10)',
  series: ['#157A4E', '#4F7FD0', '#B8821F', '#A65BA0'] as const,
  grid: '#E8DED4',
  axis: '#D9D4C8',
  tick: '#756A62',
  cursorFill: 'rgba(217, 78, 18, 0.05)',
};

export const axisProps = {
  tick: { fill: CHART.tick, fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: CHART.axis },
} as const;

export const yAxisProps = {
  tick: { fill: CHART.tick, fontSize: 12 },
  tickLine: false,
  axisLine: false,
  width: 48,
} as const;

/* ------------------------------- Tooltip -------------------------------- */

export function ChartTooltip({
  active,
  payload,
  label,
  format = (v) => v.toLocaleString('en-US'),
}: {
  active?: boolean;
  payload?: TooltipPayload;
  label?: string | number;
  format?: (value: number, name: string) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5 text-xs shadow-lift">
      {label !== undefined && label !== '' && <p className="mb-1.5 font-semibold text-ink">{label}</p>}
      <ul className="space-y-1">
        {payload.map((p, i) => {
          const name = String(p.name ?? p.dataKey ?? '');
          const raw = Array.isArray(p.value) ? p.value[0] : p.value;
          const color = (p.payload as { fill?: string } | undefined)?.fill ?? p.color ?? p.stroke ?? CHART.single;
          return (
            <li key={`${name}-${i}`} className="flex items-center gap-2 text-muted">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
              <span>{name}</span>
              <span className="ml-auto pl-4 font-semibold tabular-nums text-ink">{format(Number(raw ?? 0), name)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------ Legend ----------------------------------- */

export function ChartLegend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} aria-hidden />
          <span>{i.label}</span>
          {i.value && <span className="font-semibold text-ink tabular-nums">{i.value}</span>}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ ChartCard -------------------------------- */

export interface ChartTable {
  columns: string[];
  rows: (string | number)[][];
}

/**
 * Card with a fixed-height chart area (required by ResponsiveContainer) and a
 * Chart / Table toggle so every figure is also available as text.
 */
export function ChartCard({
  title,
  description,
  children,
  height = 260,
  table,
  legend,
  demo = true,
  className,
  empty,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  height?: number;
  table?: ChartTable;
  legend?: ReactNode;
  demo?: boolean;
  className?: string;
  /** Rendered instead of the chart when set. */
  empty?: ReactNode;
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <section className={cn('flex min-w-0 flex-col rounded-2xl border border-line/80 bg-surface shadow-[0_1px_2px_rgb(32_39_34/0.04)]', className)}>
      <header className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-sans text-[15px] font-semibold tracking-normal text-ink">{title}</h2>
            {demo && <DemoBadge />}
          </div>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {table && !empty && (
          <div className="flex shrink-0 rounded-lg bg-sand p-0.5" role="group" aria-label={`${title} view`}>
            {(['chart', 'table'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                aria-label={v === 'chart' ? 'Show chart' : 'Show table'}
                title={v === 'chart' ? 'Chart' : 'Table'}
                onClick={() => setView(v)}
                className={cn(
                  'flex h-7 w-8 items-center justify-center rounded-md text-muted transition',
                  view === v && 'bg-surface text-ink shadow-sm',
                )}
              >
                {v === 'chart' ? <ChartColumn className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        )}
      </header>
      {legend && view === 'chart' && !empty && <div className="px-5 pt-3">{legend}</div>}
      <div className="px-3 pt-3 pb-4 sm:px-4">
        {empty ? (
          <div className="flex items-center justify-center text-sm text-muted" style={{ height }}>
            {empty}
          </div>
        ) : view === 'table' && table ? (
          <div className="overflow-auto px-1" style={{ maxHeight: height }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted uppercase">
                  {table.columns.map((c, i) => (
                    <th key={c} scope="col" className={cn('py-2 font-semibold', i > 0 && 'text-right')}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, ri) => (
                  <tr key={ri} className="border-b border-line/50 last:border-0">
                    {r.map((cell, ci) => (
                      <td key={ci} className={cn('py-2', ci > 0 && 'text-right tabular-nums')}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ height }} className="w-full min-w-0">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
