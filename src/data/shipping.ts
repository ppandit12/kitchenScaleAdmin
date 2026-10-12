import type { Country, ShippingZone } from '@/types';

/** Countries the store sells to (North America + Europe). */
export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', zone: 'north_america', regionLabel: 'state' },
  { code: 'CA', name: 'Canada', zone: 'north_america', regionLabel: 'province' },
  { code: 'GB', name: 'United Kingdom', zone: 'europe', regionLabel: 'county' },
  { code: 'IE', name: 'Ireland', zone: 'europe', regionLabel: 'county' },
  { code: 'FR', name: 'France', zone: 'europe', regionLabel: 'region' },
  { code: 'DE', name: 'Germany', zone: 'europe', regionLabel: 'state' },
  { code: 'ES', name: 'Spain', zone: 'europe', regionLabel: 'province' },
  { code: 'IT', name: 'Italy', zone: 'europe', regionLabel: 'province' },
  { code: 'NL', name: 'Netherlands', zone: 'europe', regionLabel: 'province' },
  { code: 'BE', name: 'Belgium', zone: 'europe', regionLabel: 'province' },
  { code: 'AT', name: 'Austria', zone: 'europe', regionLabel: 'state' },
  { code: 'PT', name: 'Portugal', zone: 'europe', regionLabel: 'region' },
  { code: 'SE', name: 'Sweden', zone: 'europe', regionLabel: 'region' },
  { code: 'DK', name: 'Denmark', zone: 'europe', regionLabel: 'region' },
  { code: 'FI', name: 'Finland', zone: 'europe', regionLabel: 'region' },
  { code: 'PL', name: 'Poland', zone: 'europe', regionLabel: 'region' },
];

export function getCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

export function countryName(code: string): string {
  return getCountry(code)?.name ?? code;
}

/** DEMO shipping zones & rates (USD). Editable in Admin → Settings → Shipping zones. */
export const DEFAULT_SHIPPING_ZONES: ShippingZone[] = [
  {
    id: 'north_america',
    name: 'North America',
    countries: ['US', 'CA'],
    enabled: true,
    rates: [
      { id: 'na-standard', name: 'Standard', etaDays: [5, 9], base: 5.5, per100g: 0.6 },
      { id: 'na-express', name: 'Express', etaDays: [2, 4], base: 14, per100g: 1.2 },
    ],
  },
  {
    id: 'europe',
    name: 'Europe',
    countries: ['GB', 'IE', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'SE', 'DK', 'FI', 'PL'],
    enabled: true,
    rates: [
      { id: 'eu-standard', name: 'Standard International', etaDays: [7, 14], base: 9.5, per100g: 0.9 },
      { id: 'eu-express', name: 'Express International', etaDays: [3, 6], base: 22, per100g: 1.6 },
    ],
  },
];
