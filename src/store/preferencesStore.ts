import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrencyCode } from '@/types';

interface PreferencesState {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  /** Country used for the cart's shipping estimate. */
  shippingCountry: string;
  setShippingCountry: (c: string) => void;
}

/**
 * Shopper preferences. Language is persisted separately by i18next
 * (localStorage key `ksc:lang`) — see src/i18n/index.ts.
 */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      currency: 'USD',
      setCurrency: (currency) => set({ currency }),
      shippingCountry: 'US',
      setShippingCountry: (shippingCountry) => set({ shippingCountry }),
    }),
    { name: 'ksc:preferences' },
  ),
);
