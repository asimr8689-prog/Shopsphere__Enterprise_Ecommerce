import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, catchError, combineLatest, of, startWith, switchMap } from 'rxjs';
import { Category, Product, stockStatus } from '@core/models';
import { CartService } from '@core/services/cart.service';
import { CategoryService } from '@core/services/category.service';
import { ProductService } from '@core/services/product.service';
import { WishlistService } from '@core/services/wishlist.service';
import { LOADING, Loadable, toLoadable } from '@core/utils/loadable';
import { PriceTagComponent } from '@shared/components/price-tag/price-tag.component';
import { ProductCardComponent } from '@shared/components/product-card/product-card.component';
import { QuantitySelectorComponent } from '@shared/components/quantity-selector/quantity-selector.component';
import { RatingStarsComponent } from '@shared/components/rating-stars/rating-stars.component';
import { EmptyStateComponent, ErrorStateComponent } from '@shared/components/state/state.components';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';

@Component({
  selector: 'app-product-details-page',
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTooltipModule,
    PriceTagComponent,
    ProductCardComponent,
    QuantitySelectorComponent,
    RatingStarsComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ImgFallbackDirective,
  ],
  templateUrl: './product-details.page.html',
  styleUrl: './product-details.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailsPage {
  private readonly products = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  /** Bound from the :slug route param via withComponentInputBinding(). */
  readonly slug = input.required<string>();

  private readonly retry$ = new Subject<void>();
  readonly state = toSignal(
    combineLatest([toObservable(this.slug), this.retry$.pipe(startWith(undefined))]).pipe(
      switchMap(([slug]) => toLoadable(this.products.getBySlug(slug))),
    ),
    { initialValue: LOADING as Loadable<Product | undefined> },
  );
  readonly product = computed(() => this.state().data ?? null);

  readonly related = toSignal(
    toObservable(this.product).pipe(switchMap((p) => (p ? this.products.getRelated(p, 4).pipe(catchError(() => of([]))) : of([])))),
    { initialValue: [] as Product[] },
  );

  readonly categoryMap = toSignal(
    inject(CategoryService).categoryMap$.pipe(catchError(() => of({} as Record<string, Category>))),
    { initialValue: {} as Record<string, Category> },
  );

  readonly selectedImage = signal(0);
  readonly quantity = signal(1);
  readonly zoom = signal<{ x: number; y: number } | null>(null);

  readonly stock = computed(() => stockStatus(this.product()?.stock ?? 0));
  readonly inCart = computed(() => this.cart.items().find((i) => i.productId === this.product()?.id)?.quantity ?? 0);
  readonly maxAddable = computed(() => Math.max(0, (this.product()?.stock ?? 0) - this.inCart()));
  readonly isWishlisted = computed(() => {
    const p = this.product();
    return !!p && this.wishlist.ids().includes(p.id);
  });

  /** Rating distribution for the reviews summary (5★ → 1★). */
  readonly ratingBreakdown = computed(() => {
    const reviews = this.product()?.reviews ?? [];
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
      return { stars, count, pct: reviews.length ? Math.round((count / reviews.length) * 100) : 0 };
    });
  });

  constructor() {
    // Reset gallery/quantity when navigating between products and update the document title.
    effect(() => {
      const p = this.product();
      this.selectedImage.set(0);
      this.quantity.set(1);
      if (p) this.title.setTitle(`${p.name} – ShopSphere`);
    });
  }

  selectImage(index: number): void {
    const count = this.product()?.images.length ?? 0;
    if (count) this.selectedImage.set((index + count) % count);
  }

  onZoomMove(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    this.zoom.set({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
  }

  addToCart(): void {
    const p = this.product();
    if (p && this.maxAddable() > 0) {
      this.cart.add(p, Math.min(this.quantity(), this.maxAddable()));
      this.quantity.set(1);
    }
  }

  buyNow(): void {
    const p = this.product();
    if (!p) return;
    if (this.maxAddable() > 0) this.cart.add(p, Math.min(this.quantity(), this.maxAddable()));
    this.router.navigateByUrl('/checkout');
  }

  toggleWishlist(): void {
    const p = this.product();
    if (p) this.wishlist.toggle(p.id);
  }

  retry(): void {
    this.retry$.next();
  }
}
