export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  /** Unit price at the moment the item was added. */
  price: number;
  compareAtPrice?: number | null;
  quantity: number;
  /** Stock snapshot used to cap quantity selectors. */
  maxQuantity: number;
}

export type CouponType = 'percent' | 'fixed' | 'shipping';

export interface Coupon {
  code: string;
  type: CouponType;
  value: number;
  minSubtotal: number;
  description: string;
}

export interface DeliveryOption {
  id: 'standard' | 'express' | 'next-day';
  label: string;
  price: number;
  etaDays: number;
  description: string;
}

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  { id: 'standard', label: 'Standard delivery', price: 6.99, etaDays: 5, description: '3–5 business days · free over $99' },
  { id: 'express', label: 'Express delivery', price: 14.99, etaDays: 2, description: '1–2 business days' },
  { id: 'next-day', label: 'Next-day delivery', price: 24.99, etaDays: 1, description: 'Order before 6 pm' },
];

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  /** Savings from sale prices (compare-at minus price). */
  productSavings: number;
  couponDiscount: number;
  shipping: number;
  tax: number;
  total: number;
  freeShippingRemaining: number;
}
