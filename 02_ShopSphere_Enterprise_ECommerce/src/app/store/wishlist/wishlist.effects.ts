import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mergeMap, tap, withLatestFrom } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { CartActions } from '../cart/cart.actions';
import { WishlistActions } from './wishlist.actions';
import { selectWishlistIds } from './wishlist.reducer';

/** "Move to cart" = add one unit to the cart and remove from the wishlist. */
export const moveToCart$ = createEffect(
  (actions$ = inject(Actions)) =>
    actions$.pipe(
      ofType(WishlistActions.moveToCart),
      mergeMap(({ product }) => [
        CartActions.addItem({ product, quantity: 1 }),
        WishlistActions.remove({ productId: product.id }),
      ]),
    ),
  { functional: true },
);

export const wishlistToggleToast$ = createEffect(
  (actions$ = inject(Actions), store = inject(Store), notify = inject(NotificationService)) =>
    actions$.pipe(
      ofType(WishlistActions.toggle),
      withLatestFrom(store.select(selectWishlistIds)),
      tap(([{ productId }, ids]) =>
        ids.includes(productId)
          ? notify.success('Saved to your wishlist', { label: 'View', link: '/wishlist' })
          : notify.info('Removed from your wishlist'),
      ),
    ),
  { functional: true, dispatch: false },
);
