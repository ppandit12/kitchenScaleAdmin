import { create } from 'zustand';
import type { Coupon, CouponValidation } from '@/types';
import { round2 } from '@/utils';
import { enc, http } from './http';

export function computeDiscount(coupon: Pick<Coupon, 'type' | 'value'>, subtotal: number): number {
  const raw = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  return round2(Math.min(raw, subtotal));
}

/**
 * Coupons the API has already resolved (code → coupon, or null when unknown).
 * The cart uses this to re-price instantly as quantities change; the server re-validates on order.
 */
export const useCouponCache = create<{ coupons: Record<string, Coupon | null> }>()(() => ({ coupons: {} }));

const remember = (code: string, coupon: Coupon | null) =>
  useCouponCache.setState((s) => ({ coupons: { ...s.coupons, [code.trim().toUpperCase()]: coupon } }));

function evaluate(coupon: Coupon | null | undefined, subtotal: number): CouponValidation {
  if (!coupon) return { valid: false, discount: 0, reason: 'notFound' };
  if (!coupon.active) return { valid: false, coupon, discount: 0, reason: 'inactive' };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) return { valid: false, coupon, discount: 0, reason: 'expired' };
  if (subtotal < coupon.minSubtotal) return { valid: false, coupon, discount: 0, reason: 'minSubtotal' };
  return { valid: true, coupon, discount: computeDiscount(coupon, subtotal) };
}

/**
 * Synchronous check against coupons already fetched from the API.
 * Returns `null` while a code hasn't been looked up yet (call `couponService.validate` first).
 */
export function validateCouponSync(code: string, subtotal: number): CouponValidation | null {
  const key = code.trim().toUpperCase();
  const cached = useCouponCache.getState().coupons;
  if (!(key in cached)) return null;
  return evaluate(cached[key], subtotal);
}

export const couponService = {
  async validate(code: string, subtotal: number): Promise<CouponValidation> {
    const result = await http.post<CouponValidation>('/coupons/validate', { code, subtotal });
    remember(code, result.coupon ?? null);
    return result;
  },
  list: () => http.get<Coupon[]>('/coupons'),
  create: (c: Omit<Coupon, 'id' | 'createdAt' | 'usageCount'> & Partial<Coupon>) => http.post<Coupon>('/coupons', stripMeta(c)),
  update: (id: string, patch: Partial<Coupon>) => http.patch<Coupon>(`/coupons/${enc(id)}`, stripMeta(patch)),
  remove: (id: string) => http.delete(`/coupons/${enc(id)}`),
};

/** The API owns id / usage / timestamps. */
function stripMeta(c: Partial<Coupon>) {
  const { id: _id, usageCount: _u, createdAt: _c, ...rest } = c as Partial<Coupon> & { updatedAt?: string };
  delete (rest as { updatedAt?: string }).updatedAt;
  return rest;
}
