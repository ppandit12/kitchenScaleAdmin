import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, ProductVariant } from '@/types';
import { round2 } from '@/utils';
import { analytics } from '@/services/analyticsService';

interface CartState {
  items: CartItem[];
  /** Applied coupon code (re-validated whenever the subtotal changes). */
  couponCode: string | null;
  isDrawerOpen: boolean;

  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      isDrawerOpen: false,

      addItem: (product, variant, quantity = 1) => {
        const items = [...get().items];
        const existing = items.find((i) => i.variantId === variant.id);
        const max = Math.max(0, variant.stock);
        if (max === 0) return;
        if (existing) {
          existing.quantity = Math.min(max, existing.quantity + quantity);
          existing.maxQuantity = max;
        } else {
          items.push({
            id: variant.id,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            variantId: variant.id,
            variantTitle: variant.title,
            sku: variant.sku,
            price: variant.price,
            quantity: Math.min(max, quantity),
            colorHex: variant.colorHex,
            units: variant.units,
            weightGrams: variant.weightGrams,
            maxQuantity: max,
          });
        }
        set({ items: items.map((i) => ({ ...i })) });
        analytics.event('add_to_cart', { item_id: variant.sku, quantity, value: variant.price, currency: 'USD' });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) return get().removeItem(variantId);
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: Math.min(i.maxQuantity, quantity) } : i,
          ),
        });
      },

      removeItem: (variantId) => set({ items: get().items.filter((i) => i.variantId !== variantId) }),
      clear: () => set({ items: [], couponCode: null }),
      applyCoupon: (code) => set({ couponCode: code.trim().toUpperCase() }),
      removeCoupon: () => set({ couponCode: null }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
    }),
    {
      name: 'ksc:cart',
      partialize: (s) => ({ items: s.items, couponCode: s.couponCode }),
    },
  ),
);

/* ------------------------------ Selectors ------------------------------ */

export const selectItemCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);
export const selectSubtotal = (s: CartState) => round2(s.items.reduce((n, i) => n + i.price * i.quantity, 0));
export const selectWeight = (s: CartState) => s.items.reduce((n, i) => n + i.weightGrams * i.quantity, 0);
