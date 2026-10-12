import type { NewOrderInput, Order, OrderStatus } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { enc, http, orUndefined } from './http';

export const orderService = {
  /** Admin: every order, newest first. */
  list: () => http.get<Order[]>('/orders'),

  /**
   * Orders for a customer. The signed-in customer gets their own orders; an admin viewing
   * another customer gets that customer's orders.
   */
  listForCustomer(customerId: string, _email?: string): Promise<Order[]> {
    return useAuthStore.getState().admin
      ? http.get<Order[]>(`/orders/customer/${enc(customerId)}`)
      : http.get<Order[]>('/orders/mine');
  },

  get: (id: string) => orUndefined(http.get<Order>(`/orders/${enc(id)}`)),

  /** Works for admins, the order's owner, or the browser that just placed it. */
  getByNumber: (orderNumber: string) => orUndefined(http.get<Order>(`/orders/by-number/${enc(orderNumber.trim())}`)),

  /** Tracking lookup — requires the order number AND the order's email. */
  track: (orderNumber: string, email: string) => orUndefined(http.post<Order>('/orders/track', { orderNumber, email })),

  /**
   * Places an order. Only ids, quantities and choices are sent — the server re-prices every line,
   * re-validates the coupon, recomputes shipping and reserves stock. No payment is taken.
   */
  create(input: NewOrderInput): Promise<Order> {
    return http.post<Order>('/orders', {
      customer: input.customer,
      shippingAddress: input.shippingAddress,
      items: input.items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      couponCode: input.couponCode || null,
      shippingMethodId: input.shippingMethod.id,
      paymentMethod: input.paymentMethod,
      displayCurrency: input.displayCurrency,
    });
  },

  updateStatus: (id: string, status: OrderStatus, note?: string) => http.patch<Order>(`/orders/${enc(id)}/status`, { status, note }),
  setTrackingNumber: (id: string, trackingNumber: string) => http.patch<Order>(`/orders/${enc(id)}/tracking`, { trackingNumber }),
  remove: (id: string) => http.delete(`/orders/${enc(id)}`),
};
