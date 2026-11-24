import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { errorMessage } from '@core/services/api';
import { CartService } from '@core/services/cart.service';
import { NotificationService } from '@core/services/notification.service';
import { CartActions } from './cart.actions';
import { selectCartTotals } from './cart.selectors';

/** Validates a coupon code against the (mock) coupon API. */
export const applyCoupon$ = createEffect(
  (actions$ = inject(Actions), store = inject(Store), cart = inject(CartService)) =>
    actions$.pipe(
      ofType(CartActions.applyCoupon),
      withLatestFrom(store.select(selectCartTotals)),
      switchMap(([{ code }, totals]) =>
        cart.validateCoupon(code, totals.subtotal).pipe(
          map((coupon) => CartActions.applyCouponSuccess({ coupon })),
          catchError((err) => of(CartActions.applyCouponFailure({ error: errorMessage(err) }))),
        ),
      ),
    ),
  { functional: true },
);

export const couponAppliedToast$ = createEffect(
  (actions$ = inject(Actions), notify = inject(NotificationService)) =>
    actions$.pipe(
      ofType(CartActions.applyCouponSuccess),
      tap(({ coupon }) => notify.success(`Coupon ${coupon.code} applied – ${coupon.description}`)),
    ),
  { functional: true, dispatch: false },
);

export const addedToCartToast$ = createEffect(
  (actions$ = inject(Actions), notify = inject(NotificationService)) =>
    actions$.pipe(
      ofType(CartActions.addItem),
      tap(({ product, quantity }) =>
        product.stock > 0
          ? notify.success(`${quantity} × ${product.name} added to cart`, { label: 'View cart', link: '/cart' })
          : notify.error(`${product.name} is out of stock`),
      ),
    ),
  { functional: true, dispatch: false },
);
