import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, map, throwError, switchMap, of } from 'rxjs';
import { Coupon, DeliveryOption, Product } from '../models';
import { apiUrl } from './api';
import { CartActions } from '@store/cart/cart.actions';
import {
  selectCartCount,
  selectCartIsEmpty,
  selectCartItems,
  selectCartQuantityFor,
  selectCartTotals,
  selectCoupon,
  selectCouponError,
  selectCouponStatus,
  selectCouponWarning,
  selectDeliveryOption,
} from '@store/cart/cart.selectors';

/**
 * Cart facade: components talk to this service, which exposes NgRx state as Signals
 * and turns user intent into actions. Also hosts the (mock) coupon API.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly store = inject(Store);
  private readonly http = inject(HttpClient);

  readonly items = this.store.selectSignal(selectCartItems);
  readonly totals = this.store.selectSignal(selectCartTotals);
  readonly count = this.store.selectSignal(selectCartCount);
  readonly isEmpty = this.store.selectSignal(selectCartIsEmpty);
  readonly coupon = this.store.selectSignal(selectCoupon);
  readonly couponStatus = this.store.selectSignal(selectCouponStatus);
  readonly couponError = this.store.selectSignal(selectCouponError);
  readonly couponWarning = this.store.selectSignal(selectCouponWarning);
  readonly deliveryOption = this.store.selectSignal(selectDeliveryOption);

  /** Observable variant for guards and RxJS pipelines. */
  readonly isEmpty$ = this.store.select(selectCartIsEmpty);

  quantityOf(productId: string) {
    return this.store.selectSignal(selectCartQuantityFor(productId));
  }

  add(product: Product, quantity = 1): void {
    this.store.dispatch(CartActions.addItem({ product, quantity }));
  }

  remove(productId: string): void {
    this.store.dispatch(CartActions.removeItem({ productId }));
  }

  updateQuantity(productId: string, quantity: number): void {
    this.store.dispatch(CartActions.updateQuantity({ productId, quantity }));
  }

  clear(): void {
    this.store.dispatch(CartActions.clearCart());
  }

  applyCoupon(code: string): void {
    this.store.dispatch(CartActions.applyCoupon({ code: code.trim().toUpperCase() }));
  }

  removeCoupon(): void {
    this.store.dispatch(CartActions.removeCoupon());
  }

  setDeliveryOption(optionId: DeliveryOption['id']): void {
    this.store.dispatch(CartActions.setDeliveryOption({ optionId }));
  }

  /** Mock coupon API – a real backend would validate server-side. */
  validateCoupon(code: string, subtotal: number): Observable<Coupon> {
    return this.http.get<Coupon[]>(apiUrl('coupons')).pipe(
      map((coupons) => coupons.find((c) => c.code.toUpperCase() === code.toUpperCase())),
      switchMap((coupon) => {
        if (!coupon) return throwError(() => new Error(`"${code}" is not a valid coupon code.`));
        if (subtotal < coupon.minSubtotal) {
          return throwError(() => new Error(`${coupon.code} needs a subtotal of at least $${coupon.minSubtotal}.`));
        }
        return of(coupon);
      }),
    );
  }
}
