import { useCallback, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Inbox, Search, X } from 'lucide-react';
import { Badge, DemoBadge, Skeleton, type BadgeTone } from '@/components/common';
import { useMoney } from '@/hooks/useMoney';
import type { CampaignStatus, OrderStatus, ReviewStatus } from '@/types';
import { cn } from '@/utils';

/* ------------------------------- Money ---------------------------------- */

/** Admin always shows the base currency (USD). */
export function useUsd() {
  const { format } = useMoney();
  return useCallback((usd: number) => format(usd, 'USD'), [format]);
}

/* ------------------------------ PageTitle -------------------------------- */

export function PageTitle({
  title,
  description,
  actions,
  back,
  demo,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
  demo?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link
            to={back.to}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {back.label}
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl leading-tight font-semibold sm:text-[28px]">{title}</h1>
          {demo && <DemoBadge />}
        </div>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted sm:text-[15px]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------- AdminCard ------------------------------- */

export function AdminCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  padded = true,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn('min-w-0 rounded-2xl border border-line/80 bg-surface shadow-[0_1px_2px_rgb(32_39_34/0.04)]', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line/70 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="font-sans text-[15px] font-semibold tracking-normal text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(padded && 'p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/* ------------------------------- StatCard -------------------------------- */

export function StatCard({
  label,
  value,
  icon,
  hint,
  to,
  loading,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  to?: string;
  loading?: boolean;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary" aria-hidden>
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-24" />
      ) : (
        <p className="mt-2 text-[26px] leading-none font-semibold tracking-tight text-ink">{value}</p>
      )}
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </>
  );
  const cls =
    'block min-w-0 rounded-2xl border border-line/80 bg-surface p-5 shadow-[0_1px_2px_rgb(32_39_34/0.04)] transition';
  return to ? (
    <Link to={to} className={cn(cls, 'hover:border-primary/30 hover:shadow-soft')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ------------------------------- FilterBar ------------------------------- */

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 border-b border-line/70 p-4 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      {children}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative min-w-0 flex-1 sm:max-w-sm', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={value}
        aria-label={label}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-9 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-sand hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/** Compact select for filter bars (not tied to react-hook-form). */
export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <label className={cn('flex items-center gap-2 text-sm text-muted', className)}>
      <span className="whitespace-nowrap">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-sm text-ink focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none sm:flex-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ------------------------------- DataTable ------------------------------- */

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide this column below the given breakpoint (keeps tables readable on phones). */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'right' | 'center';
  /** Stop row click propagation (for action buttons). */
  stopClick?: boolean;
}

const hideCls = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
};
const alignCls = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  loading,
  skeletonRows = 5,
  empty,
  caption,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  skeletonRows?: number;
  empty?: ReactNode;
  caption?: string;
}) {
  return (
    // `relative` makes this scroller the containing block for absolutely positioned
    // descendants (e.g. sr-only labels), so they can't escape it and widen the page.
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line/70 bg-cream/60">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  'px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-muted uppercase first:pl-5 last:pr-5',
                  alignCls[c.align ?? 'left'],
                  c.hideBelow && hideCls[c.hideBelow],
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i} className="border-b border-line/50 last:border-0">
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-4 first:pl-5 last:pr-5', c.hideBelow && hideCls[c.hideBelow])}>
                    <Skeleton className="h-4 w-full max-w-[140px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : !rows || rows.length === 0 ? (
            <EmptyRow colSpan={columns.length}>{empty ?? 'Nothing to show yet.'}</EmptyRow>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-line/50 transition-colors last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-cream/70',
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    onClick={c.stopClick ? (e) => e.stopPropagation() : undefined}
                    className={cn(
                      'px-4 py-3.5 align-middle first:pl-5 last:pr-5',
                      alignCls[c.align ?? 'left'],
                      c.hideBelow && hideCls[c.hideBelow],
                      c.className,
                    )}
                  >
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-14 text-center">
        <div className="flex flex-col items-center gap-3 text-muted">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-100 text-primary">
            <Inbox className="h-5 w-5" aria-hidden />
          </span>
          <div className="text-sm">{children}</div>
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------ Pagination ------------------------------- */

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-line bg-surface px-2 text-sm text-ink transition hover:border-primary/40 disabled:pointer-events-none disabled:opacity-40';
  return (
    <nav aria-label="Pagination" className="flex flex-col items-center justify-between gap-3 border-t border-line/70 px-5 py-3.5 sm:flex-row">
      <p className="text-sm text-muted">
        Showing <span className="font-medium text-ink">{from}</span>–<span className="font-medium text-ink">{to}</span> of{' '}
        <span className="font-medium text-ink">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button type="button" className={btn} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(btn, p === page && 'border-primary bg-primary text-cream hover:border-primary')}
          >
            {p}
          </button>
        ))}
        <button type="button" className={btn} onClick={() => onChange(page + 1)} disabled={page >= pageCount} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

/* ----------------------------- Status badges ----------------------------- */

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const orderTone: Record<OrderStatus, BadgeTone> = {
  placed: 'neutral',
  confirmed: 'info',
  processing: 'warning',
  shipped: 'accent',
  out_for_delivery: 'accent',
  delivered: 'success',
  cancelled: 'danger',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={orderTone[status]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}

const campaignTone: Record<CampaignStatus, BadgeTone> = { draft: 'neutral', scheduled: 'info', sent: 'success' };
export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge tone={campaignTone[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
}

const reviewTone: Record<ReviewStatus, BadgeTone> = { pending: 'warning', approved: 'success', rejected: 'danger' };
export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  return <Badge tone={reviewTone[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
}

/* ------------------------------ Misc helpers ----------------------------- */

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{children}</dd>
    </div>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
  return (
    <span
      aria-hidden
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-xs font-semibold text-primary',
        className,
      )}
    >
      {letters || '?'}
    </span>
  );
}

/** Icon-only action button used in table rows. */
export function IconAction({
  label,
  onClick,
  children,
  tone = 'default',
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  tone?: 'default' | 'danger' | 'success';
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition disabled:opacity-40',
        tone === 'danger' && 'hover:bg-danger/10 hover:text-danger',
        tone === 'success' && 'hover:bg-success/10 hover:text-success',
        tone === 'default' && 'hover:bg-sand hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

/** Skeleton block matching a card. */
export function CardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-64 rounded-2xl', className)} />;
}
