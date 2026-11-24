import { createSelector } from '@ngrx/store';
import { cartFeature } from './cart.reducer';

export const {
  selectItems: selectCartItems,
  selectCoupon,
  selectCouponStatus,
  selectCouponError,
  selectCouponWarning,
  selectDeliveryOption,
  selectTotals: selectCartTotals,
  selectItemCount: selectCartCount,
  selectIsEmpty: selectCartIsEmpty,
} = cartFeature;

/** Factory selector: quantity of a given product already in the cart (0 if none). */
export const selectCartQuantityFor = (productId: string) =>
  createSelector(selectCartItems, (items) => items.find((i) => i.productId === productId)?.quantity ?? 0);
