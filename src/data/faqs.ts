/**
 * FAQ entries. Text lives in the `faq` i18n namespace under `items.<id>.q` / `items.<id>.a`.
 *   const { t } = useTranslation('faq'); t(`items.${faq.id}.q`)
 */
export type FaqCategory = 'product' | 'orders' | 'payments' | 'returns';

export interface FaqEntry {
  id: string;
  category: FaqCategory;
  /** Shown in the homepage FAQ preview. */
  featured?: boolean;
}

export const FAQS: FaqEntry[] = [
  { id: 'howToUse', category: 'product', featured: true },
  { id: 'ingredients', category: 'product', featured: true },
  { id: 'units', category: 'product' },
  { id: 'cleaning', category: 'product' },
  { id: 'battery', category: 'product' },
  { id: 'international', category: 'orders', featured: true },
  { id: 'tracking', category: 'orders', featured: true },
  { id: 'payments', category: 'payments', featured: true },
  { id: 'returns', category: 'returns' },
];
