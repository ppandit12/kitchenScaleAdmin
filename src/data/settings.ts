import type { CurrencyCode, LanguageCode, StoreSettings } from '@/types';
import { DEFAULT_SHIPPING_ZONES } from './shipping';

export const BASE_CURRENCY: CurrencyCode = 'USD';

export const CURRENCIES: { code: CurrencyCode; symbol: string; label: string; locale: string }[] = [
  { code: 'USD', symbol: '$', label: 'US Dollar', locale: 'en-US' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'EUR', symbol: '€', label: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', label: 'British Pound', locale: 'en-GB' },
];

export const LANGUAGES: { code: LanguageCode; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'de', label: 'Deutsch', short: 'DE' },
  { code: 'es', label: 'Español', short: 'ES' },
];

/** DEMO exchange rates relative to USD. Not live market data. */
export const DEFAULT_EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  CAD: 1.37,
  EUR: 0.92,
  GBP: 0.79,
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'KitchenScaleCo',
  supportEmail: 'frankieyiadom1@gmail.com',
  supportPhone: '+1 (780) 802-8973',
  businessAddress: 'Business address to be confirmed',
  announcement: { enabled: true, text: 'Precision in Every Scoop' },
  brandColors: {
    primary: '#D94E12',
    secondary: '#FF9068',
    background: '#FFF9F2',
    text: '#191714',
    accent: '#F7E5D8',
  },
  languages: ['en', 'fr', 'de', 'es'],
  defaultLanguage: 'en',
  currencies: ['USD', 'CAD', 'EUR', 'GBP'],
  defaultCurrency: 'USD',
  exchangeRates: DEFAULT_EXCHANGE_RATES,
  shippingZones: DEFAULT_SHIPPING_ZONES,
  // Placeholder destinations — replace with the brand's real profiles in Admin → Settings.
  social: {
    instagram: 'https://www.instagram.com/kitchenscaleco?mdxt=ODZ3Z2JrODV3dXl1',
    facebook: 'https://www.facebook.com/share/19QXXLWNCG/?mibextid=wwXIfr',
    pinterest: 'https://www.pinterest.com/',
    tiktok: 'https://www.tiktok.com/',
    youtube: 'https://www.youtube.com/',
  },
  notifications: { newOrder: true, lowStock: true, newReview: true, newSubscriber: false },
  lowStockThreshold: 8,
};
