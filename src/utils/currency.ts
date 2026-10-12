import type { CurrencyCode } from '@/types';
import { CURRENCIES } from '@/data/settings';

/** Convert a USD (base) amount using DEMO exchange rates. */
export function convert(usd: number, currency: CurrencyCode, rates: Record<CurrencyCode, number>): number {
  return usd * (rates[currency] ?? 1);
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  const meta = CURRENCIES.find((c) => c.code === currency);
  try {
    return new Intl.NumberFormat(meta?.locale ?? 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
