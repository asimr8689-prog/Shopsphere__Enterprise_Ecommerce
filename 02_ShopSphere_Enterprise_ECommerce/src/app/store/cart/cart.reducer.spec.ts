import { Product } from '@core/models';
import { CartActions } from './cart.actions';
import { cartFeature, cartReducer, initialCartState } from './cart.reducer';

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p-1',
  slug: 'p-1',
  name: 'Test product',
  brand: 'Brand',
  categoryId: 'audio',
  shortDescription: '',
  description: '',
  price: 50,
  compareAtPrice: null,
  rating: 4,
  reviewCount: 1,
  stock: 3,
  sold: 0,
  images: ['a.svg'],
  specs: [],
  tags: [],
  reviews: [],
  createdAt: '2026-01-01',
  ...overrides,
});

describe('cartReducer', () => {
  it('adds a new item', () => {
    const state = cartReducer(initialCartState, CartActions.addItem({ product: product(), quantity: 2 }));
    expect(state.items.length).toBe(1);
    expect(state.items[0].quantity).toBe(2);
  });

  it('merges quantities and caps them at available stock', () => {
    let state = cartReducer(initialCartState, CartActions.addItem({ product: product(), quantity: 2 }));
    state = cartReducer(state, CartActions.addItem({ product: product(), quantity: 5 }));
    expect(state.items.length).toBe(1);
    expect(state.items[0].quantity).toBe(3);
  });

  it('ignores out-of-stock products', () => {
    const state = cartReducer(initialCartState, CartActions.addItem({ product: product({ stock: 0 }), quantity: 1 }));
    expect(state.items.length).toBe(0);
  });

  it('removes an item when quantity is set to 0', () => {
    let state = cartReducer(initialCartState, CartActions.addItem({ product: product(), quantity: 1 }));
    state = cartReducer(state, CartActions.updateQuantity({ productId: 'p-1', quantity: 0 }));
    expect(state.items.length).toBe(0);
  });

  it('tracks coupon request status', () => {
    let state = cartReducer(initialCartState, CartActions.applyCoupon({ code: 'BAD' }));
    expect(state.couponStatus).toBe('applying');
    state = cartReducer(state, CartActions.applyCouponFailure({ error: 'nope' }));
    expect(state.couponStatus).toBe('error');
    expect(state.couponError).toBe('nope');
  });

  it('clears everything', () => {
    let state = cartReducer(initialCartState, CartActions.addItem({ product: product(), quantity: 1 }));
    state = cartReducer(state, CartActions.clearCart());
    expect(state).toEqual(initialCartState);
  });

  it('selects totals through the feature selector', () => {
    const state = cartReducer(initialCartState, CartActions.addItem({ product: product(), quantity: 2 }));
    const totals = cartFeature.selectTotals.projector(state.items, null, { id: 'express', label: '', price: 14.99, etaDays: 2, description: '' });
    expect(totals.subtotal).toBe(100);
    expect(totals.shipping).toBe(14.99);
  });
});
