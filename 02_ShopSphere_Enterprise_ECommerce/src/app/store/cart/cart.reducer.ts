import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { CartItem, Coupon, DELIVERY_OPTIONS, DeliveryOption } from '@core/models';
import { CartActions } from './cart.actions';
import { calculateCartTotals, isCouponApplicable } from './cart.utils';

export interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  couponStatus: 'idle' | 'applying' | 'error';
  couponError: string | null;
  deliveryOptionId: DeliveryOption['id'];
}

export const initialCartState: CartState = {
  items: [],
  coupon: null,
  couponStatus: 'idle',
  couponError: null,
  deliveryOptionId: 'standard',
};

const clampQty = (qty: number, max: number) => Math.max(1, Math.min(Math.floor(qty) || 1, Math.max(1, max)));

export const cartReducer = createReducer(
  initialCartState,
  on(CartActions.addItem, (state, { product, quantity }): CartState => {
    if (product.stock <= 0) return state;
    const existing = state.items.find((i) => i.productId === product.id);
    if (existing) {
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: clampQty(i.quantity + quantity, product.stock), maxQuantity: product.stock, price: product.price }
            : i,
        ),
      };
    }
    const item: CartItem = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.images[0] ?? '',
      price: product.price,
      compareAtPrice: product.compareAtPrice ?? null,
      quantity: clampQty(quantity, product.stock),
      maxQuantity: product.stock,
    };
    return { ...state, items: [...state.items, item] };
  }),
  on(CartActions.removeItem, (state, { productId }): CartState => ({
    ...state,
    items: state.items.filter((i) => i.productId !== productId),
  })),
  on(CartActions.updateQuantity, (state, { productId, quantity }): CartState => ({
    ...state,
    items:
      quantity <= 0
        ? state.items.filter((i) => i.productId !== productId)
        : state.items.map((i) => (i.productId === productId ? { ...i, quantity: clampQty(quantity, i.maxQuantity) } : i)),
  })),
  on(CartActions.clearCart, (): CartState => initialCartState),
  on(CartActions.applyCoupon, (state): CartState => ({ ...state, couponStatus: 'applying', couponError: null })),
  on(CartActions.applyCouponSuccess, (state, { coupon }): CartState => ({
    ...state,
    coupon,
    couponStatus: 'idle',
    couponError: null,
  })),
  on(CartActions.applyCouponFailure, (state, { error }): CartState => ({
    ...state,
    couponStatus: 'error',
    couponError: error,
  })),
  on(CartActions.removeCoupon, (state): CartState => ({ ...state, coupon: null, couponStatus: 'idle', couponError: null })),
  on(CartActions.setDeliveryOption, (state, { optionId }): CartState => ({ ...state, deliveryOptionId: optionId })),
);

export const cartFeature = createFeature({
  name: 'cart',
  reducer: cartReducer,
  extraSelectors: ({ selectItems, selectCoupon, selectDeliveryOptionId }) => {
    const selectDeliveryOption = createSelector(
      selectDeliveryOptionId,
      (id) => DELIVERY_OPTIONS.find((o) => o.id === id) ?? DELIVERY_OPTIONS[0],
    );
    const selectTotals = createSelector(selectItems, selectCoupon, selectDeliveryOption, (items, coupon, delivery) =>
      calculateCartTotals(items, coupon, delivery),
    );
    const selectItemCount = createSelector(selectTotals, (t) => t.itemCount);
    const selectIsEmpty = createSelector(selectItems, (items) => items.length === 0);
    const selectCouponWarning = createSelector(selectCoupon, selectTotals, (coupon, totals) =>
      coupon && !isCouponApplicable(coupon, totals.subtotal)
        ? `Add $${(coupon.minSubtotal - totals.subtotal).toFixed(2)} more to use ${coupon.code}.`
        : null,
    );
    return { selectDeliveryOption, selectTotals, selectItemCount, selectIsEmpty, selectCouponWarning };
  },
});
