import { Address } from './user.model';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'out-for-delivery' | 'delivered' | 'cancelled';

export const ORDER_STATUS_FLOW: OrderStatus[] = ['pending', 'processing', 'shipped', 'out-for-delivery', 'delivered'];

export type PaymentMethod = 'card' | 'paypal' | 'cod';

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  date: string;
  note: string;
}

export interface Order {
  id: string;
  number: string;
  userId: string;
  customer: { firstName: string; lastName: string; email: string; phone: string };
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string | null;
  delivery: { id: string; label: string; price: number; etaDays: number };
  /** Mock payment only – no real transaction is ever made. */
  payment: { method: PaymentMethod; label: string; cardLast4?: string };
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery: string;
  timeline: OrderTimelineEntry[];
}

export interface CheckoutPayload {
  customer: Order['customer'];
  shippingAddress: Address;
  deliveryOptionId: string;
  paymentMethod: PaymentMethod;
  cardLast4?: string;
}
