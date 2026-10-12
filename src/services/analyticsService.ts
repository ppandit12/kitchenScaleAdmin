import type { AnalyticsEventParams } from '@/types';

/**
 * Analytics abstraction, ready for GA4.
 * No measurement ID is bundled. Set VITE_GA4_MEASUREMENT_ID in a .env file once the client
 * has a real GA4 property; until then every call is a no-op (logged to the console in dev).
 */

export interface AnalyticsProvider {
  init(): void;
  pageView(path: string, title?: string): void;
  event(name: string, params?: AnalyticsEventParams): void;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

class GA4Provider implements AnalyticsProvider {
  private readonly id: string;
  constructor(id: string) {
    this.id = id;
  }
  init() {
    if (window.gtag) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.id)}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // GA expects the raw `arguments` object.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', this.id, { send_page_view: false });
  }
  pageView(path: string, title?: string) {
    window.gtag?.('event', 'page_view', { page_path: path, page_title: title });
  }
  event(name: string, params?: AnalyticsEventParams) {
    window.gtag?.('event', name, params);
  }
}

class DevConsoleProvider implements AnalyticsProvider {
  init() {}
  pageView(path: string) {
    if (import.meta.env.DEV) console.debug('[analytics:demo] page_view', path);
  }
  event(name: string, params?: AnalyticsEventParams) {
    if (import.meta.env.DEV) console.debug('[analytics:demo]', name, params ?? {});
  }
}

const measurementId = (import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined)?.trim();
const provider: AnalyticsProvider = measurementId ? new GA4Provider(measurementId) : new DevConsoleProvider();

export const analytics = {
  isConfigured: Boolean(measurementId),
  init: () => provider.init(),
  pageView: (path: string, title?: string) => provider.pageView(path, title),
  /** Use GA4 recommended event names: view_item, add_to_cart, begin_checkout, purchase … */
  event: (name: string, params?: AnalyticsEventParams) => provider.event(name, params),
};
