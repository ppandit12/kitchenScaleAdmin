import { useCallback } from 'react';
import type { CurrencyCode } from '@/types';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useSettingsStore } from '@/store/settingsStore';
import { convert, formatMoney } from '@/utils/currency';

/**
 * Returns a formatter that converts USD base prices into the shopper's selected currency
 * using DEMO exchange rates. Pair displayed prices with <CurrencyNotice /> where totals matter.
 *
 *   const { format } = useMoney();
 *   format(18.99) // "€17.47" when EUR is selected
 */
export function useMoney() {
  const currency = usePreferencesStore((s) => s.currency);
  const rates = useSettingsStore((s) => s.settings.exchangeRates);

  const format = useCallback(
    (usd: number, override?: CurrencyCode) => {
      const c = override ?? currency;
      return formatMoney(convert(usd, c, rates), c);
    },
    [currency, rates],
  );

  return { currency, rate: rates[currency] ?? 1, rates, format, isBase: currency === 'USD' };
}
