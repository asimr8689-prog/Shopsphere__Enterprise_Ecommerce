import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, switchMap } from 'rxjs';
import { Product } from '../models';
import { ProductService } from './product.service';
import { WishlistActions } from '@store/wishlist/wishlist.actions';
import { selectIsWishlisted, selectWishlistCount, selectWishlistIds } from '@store/wishlist/wishlist.reducer';

/** Wishlist facade over the NgRx wishlist slice. */
@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly store = inject(Store);
  private readonly products = inject(ProductService);

  readonly ids = this.store.selectSignal(selectWishlistIds);
  readonly count = this.store.selectSignal(selectWishlistCount);

  /** Resolved products, kept in wishlist order and up to date with catalogue changes. */
  readonly products$: Observable<Product[]> = this.store
    .select(selectWishlistIds)
    .pipe(switchMap((ids) => this.products.getByIds(ids)));

  isWishlisted(productId: string) {
    return this.store.selectSignal(selectIsWishlisted(productId));
  }

  toggle(productId: string): void {
    this.store.dispatch(WishlistActions.toggle({ productId }));
  }

  remove(productId: string): void {
    this.store.dispatch(WishlistActions.remove({ productId }));
  }

  moveToCart(product: Product): void {
    this.store.dispatch(WishlistActions.moveToCart({ product }));
  }

  clear(): void {
    this.store.dispatch(WishlistActions.clear());
  }
}
