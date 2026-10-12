import type { ShippingQuote } from '@/types';
import { useSettingsStore } from '@/store/settingsStore';
import { round2 } from '@/utils';
import { http } from './http';

/**
 * Instant estimate from the shipping zones loaded with the store settings.
 * Same formula as the API (base + per100g × ceil(weight / 100)); the API's price is final at checkout.
 */
export function quoteShippingSync(countryCode: string, weightGrams: number): ShippingQuote[] {
  const zones = useSettingsStore.getState().settings.shippingZones;
  const zone = zones.find((z) => z.enabled && z.countries.includes(countryCode));
  if (!zone) return [];
  const blocks = Math.max(1, Math.ceil(weightGrams / 100));
  return zone.rates.map((r) => ({ id: r.id, name: r.name, etaDays: r.etaDays, price: round2(r.base + r.per100g * blocks) }));
}

export const shippingService = {
  quote: (country: string, weightGrams: number) => http.post<ShippingQuote[]>('/shipping/quote', { country, weightGrams }),
  /** Cheapest available rate for the cart estimate (null when the country isn't served). */
  estimate(countryCode: string, weightGrams: number): ShippingQuote | null {
    const quotes = quoteShippingSync(countryCode, weightGrams);
    return quotes.length ? quotes.reduce((a, b) => (a.price <= b.price ? a : b)) : null;
  },
};
