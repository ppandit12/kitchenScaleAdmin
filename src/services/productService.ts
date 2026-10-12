import type { Product } from '@/types';
import { enc, http, orUndefined } from './http';

/** Last list fetched — lets admin forms do quick client-side checks (the API still enforces them). */
let cache: Product[] = [];

export const productService = {
  /** Storefront list — active products only; admins can pass `includeDrafts`. */
  async list(opts: { includeDrafts?: boolean } = {}): Promise<Product[]> {
    cache = await http.get<Product[]>(`/products${opts.includeDrafts ? '?includeDrafts=1' : ''}`);
    return cache;
  },

  getBySlug: (slug: string) => orUndefined(http.get<Product>(`/products/slug/${enc(slug)}`)),

  getById: (id: string) => orUndefined(http.get<Product>(`/products/${enc(id)}`)),

  create: (product: Product) => http.post<Product>('/products', product),

  update: (id: string, patch: Partial<Product>) => http.put<Product>(`/products/${enc(id)}`, patch),

  remove: (id: string) => http.delete(`/products/${enc(id)}`),

  /** Synchronous view of the most recently fetched list. */
  snapshot(): Product[] {
    return cache;
  },
};
