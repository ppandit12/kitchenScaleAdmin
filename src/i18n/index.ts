import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { LanguageCode } from '@/types';

/**
 * Translations live in src/i18n/locales/<lang>/<namespace>.json and are picked up automatically.
 * Namespaces: common, faq, home, product, cart, checkout, account, content, chat.
 * The admin dashboard is English-only in this build.
 */
const modules = import.meta.glob('./locales/*/*.json', { eager: true, import: 'default' }) as Record<
  string,
  Record<string, unknown>
>;

const resources: Record<string, Record<string, Record<string, unknown>>> = {};
for (const [path, data] of Object.entries(modules)) {
  const match = path.match(/\.\/locales\/(\w+)\/(\w+)\.json$/);
  if (!match) continue;
  const [, lng, ns] = match;
  resources[lng] ??= {};
  resources[lng][ns] = data;
}

export const SUPPORTED_LANGUAGES: LanguageCode[] = ['en', 'fr', 'de', 'es'];
const STORAGE_KEY = 'ksc:lang';

function initialLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  const nav = navigator.language?.slice(0, 2) as LanguageCode;
  return SUPPORTED_LANGUAGES.includes(nav) ? nav : 'en';
}

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage(),
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: Object.keys(resources.en ?? { common: {} }),
  interpolation: { escapeValue: false },
  returnNull: false,
  react: { bindI18n: 'languageChanged loaded', bindI18nStore: 'added' },
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lng;
});
document.documentElement.lang = i18n.language;

export default i18n;
