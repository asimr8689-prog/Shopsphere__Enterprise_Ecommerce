import { environment } from '@env/environment';
import { CartItem, CartTotals, Coupon, DeliveryOption } from '@core/models';

export interface PricingConfig {
  freeShippingThreshold: number;
  taxRate: number;
}

const DEFAULT_CONFIG: PricingConfig = {
  freeShippingThreshold: environment.freeShippingThreshold,
  taxRate: environment.taxRate,
};

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export function isCouponApplicable(coupon: Coupon | null, subtotal: number): boolean {
  return !!coupon && subtotal >= coupon.minSubtotal;
}

export function couponDiscountFor(coupon: Coupon | null, subtotal: number): number {
  if (!coupon || !isCouponApplicable(coupon, subtotal)) return 0;
  switch (coupon.type) {
    case 'percent':
      return round2((subtotal * coupon.value) / 100);
    case 'fixed':
      return round2(Math.min(coupon.value, subtotal));
    default:
      return 0; // shipping coupons affect delivery, not the subtotal
  }
}

/**
 * Single source of truth for every price shown in cart, checkout and order records.
 * Pure function – easy to unit test and reused by the NgRx selector.
 */
export function calculateCartTotals(
  items: CartItem[],
  coupon: Coupon | null,
  delivery: DeliveryOption,
  config: PricingConfig = DEFAULT_CONFIG,
): CartTotals {
  const itemCount = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const productSavings = round2(
    items.reduce((sum, i) => sum + (i.compareAtPrice && i.compareAtPrice > i.price ? (i.compareAtPrice - i.price) * i.quantity : 0), 0),
  );
  const couponDiscount = couponDiscountFor(coupon, subtotal);
  const discounted = round2(subtotal - couponDiscount);

  let shipping = itemCount === 0 ? 0 : delivery.price;
  if (delivery.id === 'standard' && discounted >= config.freeShippingThreshold) shipping = 0;
  if (coupon?.type === 'shipping' && isCouponApplicable(coupon, subtotal)) shipping = 0;

  const tax = round2(discounted * config.taxRate);
  const total = round2(discounted + shipping + tax);
  const freeShippingRemaining = Math.max(0, round2(config.freeShippingThreshold - discounted));

  return { itemCount, subtotal, productSavings, couponDiscount, shipping, tax, total, freeShippingRemaining };
}
