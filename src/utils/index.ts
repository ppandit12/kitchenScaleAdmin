import type { Product, ProductVariant, StockState } from '@/types';

/** Join class names, skipping falsy values. */
export function cn(...classes: unknown[]): string {
  return classes.filter((c): c is string => typeof c === 'string' && c.length > 0).join(' ');
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function formatDate(iso: string, locale = 'en', opts?: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, opts ?? { year: 'numeric', month: 'short', day: 'numeric' }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string, locale = 'en'): string {
  return formatDate(iso, locale, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function stockState(stock: number, lowThreshold = 8): StockState {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= lowThreshold) return 'low_stock';
  return 'in_stock';
}

/** Find the variant matching a full set of selected option values. */
export function findVariant(product: Product, selected: Record<string, string>): ProductVariant | undefined {
  return product.variants.find((v) => product.options.every((o) => v.options[o.name] === selected[o.name]));
}

/** Lowest variant price of a product (USD). */
export function minPrice(product: Product): number {
  return Math.min(...product.variants.map((v) => v.price));
}

export function totalStock(product: Product): number {
  return product.variants.reduce((s, v) => s + Math.max(0, v.stock), 0);
}

/** Default variant: first in-stock variant, else the first variant. */
export function defaultVariant(product: Product): ProductVariant {
  return product.variants.find((v) => v.stock > 0) ?? product.variants[0];
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function averageRating(ratings: number[]): number {
  if (!ratings.length) return 0;
  return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
}

/** Download a string as a file (used for CSV exports in admin). */
export function downloadFile(filename: string, content: string, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}
