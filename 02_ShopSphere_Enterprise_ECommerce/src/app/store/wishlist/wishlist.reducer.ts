import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { WishlistActions } from './wishlist.actions';

export interface WishlistState {
  /** Product ids, most recently saved first. Details are resolved via ProductService so prices stay current. */
  productIds: string[];
}

export const initialWishlistState: WishlistState = { productIds: [] };

export const wishlistReducer = createReducer(
  initialWishlistState,
  on(WishlistActions.toggle, (state, { productId }): WishlistState => ({
    productIds: state.productIds.includes(productId)
      ? state.productIds.filter((id) => id !== productId)
      : [productId, ...state.productIds],
  })),
  on(WishlistActions.add, (state, { productId }): WishlistState =>
    state.productIds.includes(productId) ? state : { productIds: [productId, ...state.productIds] },
  ),
  on(WishlistActions.remove, (state, { productId }): WishlistState => ({
    productIds: state.productIds.filter((id) => id !== productId),
  })),
  on(WishlistActions.clear, (): WishlistState => initialWishlistState),
);

export const wishlistFeature = createFeature({
  name: 'wishlist',
  reducer: wishlistReducer,
  extraSelectors: ({ selectProductIds }) => ({
    selectWishlistCount: createSelector(selectProductIds, (ids) => ids.length),
  }),
});

export const { selectProductIds: selectWishlistIds, selectWishlistCount } = wishlistFeature;

export const selectIsWishlisted = (productId: string) =>
  createSelector(selectWishlistIds, (ids) => ids.includes(productId));
