import { useEffect, useMemo } from 'react';
import { useCartStore, selectItemCount, selectSubtotal, selectWeight } from '@/store/cartStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { useSettingsStore } from '@/store/settingsStore';
import { couponService, useCouponCache, validateCouponSync } from '@/services/couponService';
import { shippingService } from '@/services/shippingService';
import type { CouponValidation, ShippingQuote } from '@/types';
import { round2 } from '@/utils';

export interface CartTotals {
  itemCount: number;
  /** All amounts in USD (base). Format with useMoney(). */
  subtotal: number;
  weightGrams: number;
  coupon: CouponValidation | null;
  discount: number;
  /** Cheapest demo rate for the selected shipping country, or a specific quote when provided. */
  shipping: ShippingQuote | null;
  shippingAmount: number;
  total: number;
}

/**
 * Derived cart totals. Pass `shippingQuote` (from checkout) to use a chosen method;
 * otherwise the cheapest demo rate for the shopper's estimate country is used.
 */
export function useCartTotals(shippingQuote?: ShippingQuote | null): CartTotals {
  const itemCount = useCartStore(selectItemCount);
  const subtotal = useCartStore(selectSubtotal);
  const weightGrams = useCartStore(selectWeight);
  const couponCode = useCartStore((s) => s.couponCode);
  const country = usePreferencesStore((s) => s.shippingCountry);
  const zones = useSettingsStore((s) => s.settings.shippingZones);
  const couponCache = useCouponCache((s) => s.coupons);

  // A coupon restored from a previous visit hasn't been looked up yet — fetch it once.
  const needsLookup = !!couponCode && !(couponCode.toUpperCase() in couponCache);
  useEffect(() => {
    if (needsLookup && couponCode) void couponService.validate(couponCode, subtotal).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLookup, couponCode]);

  return useMemo(() => {
    const coupon = couponCode ? validateCouponSync(couponCode, subtotal) : null;
    const discount = coupon?.valid ? coupon.discount : 0;
    const shipping =
      shippingQuote !== undefined ? shippingQuote : itemCount > 0 ? shippingService.estimate(country, weightGrams) : null;
    const shippingAmount = shipping?.price ?? 0;
    return {
      itemCount,
      subtotal,
      weightGrams,
      coupon,
      discount,
      shipping,
      shippingAmount,
      total: round2(Math.max(0, subtotal - discount) + shippingAmount),
    };
    // zones/couponCache included so totals refresh when settings load or a coupon resolves
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCount, subtotal, weightGrams, couponCode, country, shippingQuote, zones, couponCache]);
}
