import type { DropshipLink, DropshipSettings, DropshipStatusInfo, Order, OrderFulfilment, Product, SupplierProduct } from '@/types';
import { enc, http } from './http';

/** Admin → Dropshipping (AliExpress). Every call requires an admin session. */
export const dropshipService = {
  status: () => http.get<DropshipStatusInfo>('/dropship/status'),
  saveSettings: (settings: DropshipSettings) => http.put<DropshipStatusInfo>('/dropship/settings', settings),
  authorizeUrl: (redirectUri: string, state: string) => http.post<{ url: string }>('/dropship/oauth/url', { redirectUri, state }),
  connect: (code: string) => http.post<DropshipStatusInfo>('/dropship/oauth/token', { code }),
  disconnect: () => http.delete<DropshipStatusInfo>('/dropship/connection'),

  preview: (input: string) =>
    http.post<{ product: SupplierProduct; markupPercent: number; alreadyImportedAs?: string }>('/dropship/preview', { input }),
  importProduct: (input: {
    supplierProductId: string;
    name?: string;
    category?: string;
    markupPercent?: number;
    skuIds?: string[];
    status: 'active' | 'draft';
  }) => http.post<Product>('/dropship/import', input),
  links: () => http.get<DropshipLink[]>('/dropship/products'),
  syncProduct: (productId: string, reprice = false) => http.post<DropshipLink>(`/dropship/products/${enc(productId)}/sync`, { reprice }),
  unlink: (productId: string) => http.delete(`/dropship/products/${enc(productId)}`),

  orderFulfilment: (orderId: string) => http.get<OrderFulfilment>(`/dropship/orders/${enc(orderId)}`),
  placeOrder: (orderId: string) => http.post<Order>(`/dropship/orders/${enc(orderId)}/place`),
  syncOrder: (orderId: string) => http.post<Order>(`/dropship/orders/${enc(orderId)}/sync`),
};
