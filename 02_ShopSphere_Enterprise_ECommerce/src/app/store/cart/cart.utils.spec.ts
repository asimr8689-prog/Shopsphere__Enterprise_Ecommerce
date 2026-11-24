import { CartItem, Coupon, DELIVERY_OPTIONS } from '@core/models';
import { calculateCartTotals, couponDiscountFor } from './cart.utils';

const cfg = { freeShippingThreshold: 99, taxRate: 0.08 };
const [standard, express] = DELIVERY_OPTIONS;
const item = (price: number, quantity: number, compareAtPrice: number | null = null): CartItem => ({
  productId: `p-${price}`,
  slug: 's',
  name: 'n',
  brand: 'b',
  image: '',
  price,
  compareAtPrice,
  quantity,
  maxQuantity: 10,
});
const coupon = (c: Partial<Coupon>): Coupon => ({ code: 'X', type: 'percent', value: 10, minSubtotal: 0, description: '', ...c });

describe('calculateCartTotals', () => {
  it('charges standard delivery below the free-shipping threshold', () => {
    const t = calculateCartTotals([item(40, 2)], null, standard, cfg);
    expect(t.subtotal).toBe(80);
    expect(t.shipping).toBe(6.99);
    expect(t.tax).toBe(6.4);
    expect(t.total).toBe(93.39);
    expect(t.freeShippingRemaining).toBe(19);
  });

  it('gives free standard delivery at or above the threshold', () => {
    expect(calculateCartTotals([item(50, 2)], null, standard, cfg).shipping).toBe(0);
  });

  it('always charges express delivery', () => {
    expect(calculateCartTotals([item(50, 2)], null, express, cfg).shipping).toBe(14.99);
  });

  it('applies percent coupons before tax and re-evaluates free shipping', () => {
    const t = calculateCartTotals([item(100, 1)], coupon({ value: 10 }), standard, cfg);
    expect(t.couponDiscount).toBe(10);
    expect(t.shipping).toBe(6.99);
    expect(t.total).toBe(104.19);
  });

  it('ignores coupons whose minimum subtotal is not met', () => {
    expect(couponDiscountFor(coupon({ value: 20, minSubtotal: 150 }), 149)).toBe(0);
    expect(couponDiscountFor(coupon({ value: 20, minSubtotal: 150 }), 200)).toBe(40);
  });

  it('caps fixed coupons at the subtotal', () => {
    expect(couponDiscountFor(coupon({ type: 'fixed', value: 25 }), 10)).toBe(10);
  });

  it('makes any delivery free with a shipping coupon', () => {
    expect(calculateCartTotals([item(20, 1)], coupon({ type: 'shipping', value: 0 }), express, cfg).shipping).toBe(0);
  });

  it('reports savings from sale prices', () => {
    expect(calculateCartTotals([item(80, 2, 100)], null, standard, cfg).productSavings).toBe(40);
  });

  it('returns zeros for an empty cart', () => {
    const t = calculateCartTotals([], null, standard, cfg);
    expect(t.total).toBe(0);
    expect(t.shipping).toBe(0);
  });
});
