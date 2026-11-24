import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Product, stockStatus } from '@core/models';
import { WishlistService } from '@core/services/wishlist.service';
import { loadableSignal } from '@core/utils/loadable';
import { PriceTagComponent } from '@shared/components/price-tag/price-tag.component';
import { RatingStarsComponent } from '@shared/components/rating-stars/rating-stars.component';
import { EmptyStateComponent, ErrorStateComponent } from '@shared/components/state/state.components';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';

@Component({
  selector: 'app-wishlist-page',
  imports: [RouterLink, MatButtonModule, MatIconModule, PriceTagComponent, RatingStarsComponent, EmptyStateComponent, ErrorStateComponent, ImgFallbackDirective],
  template: `
    <div class="container page">
      <h1 class="page-title">Wishlist</h1>
      <p class="page-subtitle">Saved on this device{{ wishlist.count() ? ' · ' + wishlist.count() + ' items' : '' }}</p>

      @if (items.state(); as s) {
        @if (s.status === 'error') {
          <app-error-state [message]="s.error ?? ''" (retry)="items.retry()" />
        } @else if (s.status === 'success' && !s.data?.length) {
          <app-empty-state icon="favorite" title="Your wishlist is empty" message="Tap the heart on any product to save it for later.">
            <a mat-flat-button routerLink="/products">Discover products</a>
          </app-empty-state>
        } @else if (s.data; as products) {
          <div class="toolbar">
            <button mat-button type="button" (click)="wishlist.clear()"><mat-icon>delete_sweep</mat-icon> Clear wishlist</button>
          </div>
          <ul class="list">
            @for (p of products; track p.id) {
              <li class="row">
                <a [routerLink]="['/products', p.slug]"><img [src]="p.images[0]" [alt]="p.name" appImgFallback width="110" height="110" /></a>
                <div class="info">
                  <span class="brand">{{ p.brand }}</span>
                  <a class="name" [routerLink]="['/products', p.slug]">{{ p.name }}</a>
                  <app-rating-stars [rating]="p.rating" [count]="p.reviewCount" />
                  <app-price-tag [price]="p.price" [compareAtPrice]="p.compareAtPrice" />
                  <span class="stock {{ status(p) }}">{{ status(p) === 'out-of-stock' ? 'Out of stock' : status(p) === 'low-stock' ? 'Low stock' : 'In stock' }}</span>
                </div>
                <div class="actions">
                  <button mat-flat-button type="button" (click)="wishlist.moveToCart(p)" [disabled]="p.stock <= 0">
                    <mat-icon>shopping_bag</mat-icon> Move to cart
                  </button>
                  <button mat-button type="button" (click)="wishlist.remove(p.id)"><mat-icon>close</mat-icon> Remove</button>
                </div>
              </li>
            }
          </ul>
        } @else {
          <p class="muted">Loading your saved items…</p>
        }
      }
    </div>
  `,
  styles: `
    .toolbar { display: flex; justify-content: flex-end; margin-bottom: 8px; }
    .list { list-style: none; padding: 0; margin: 0; display: grid; gap: 16px; }
    .row { display: grid; grid-template-columns: 110px 1fr auto; gap: 20px; align-items: center; background: var(--ss-surface); border: 1px solid var(--ss-line); border-radius: var(--ss-radius-lg); padding: 16px; }
    .row img { width: 110px; height: 110px; border-radius: var(--ss-radius); }
    .info { display: flex; flex-direction: column; gap: 4px; }
    .brand { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ss-text-muted); font-weight: 600; }
    .name { font-weight: 600; font-size: 1.05rem; color: var(--ss-ink); text-decoration: none; }
    .stock { font-size: 13px; font-weight: 600; color: var(--ss-success); }
    .stock.low-stock { color: var(--ss-warning); } .stock.out-of-stock { color: var(--ss-danger); }
    .actions { display: flex; flex-direction: column; gap: 8px; }
    @media (max-width: 699px) { .row { grid-template-columns: 80px 1fr; } .row img { width: 80px; height: 80px; } .actions { grid-column: 1 / -1; flex-direction: row; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistPage {
  readonly wishlist = inject(WishlistService);
  readonly items = loadableSignal(() => this.wishlist.products$);

  status(p: Product) {
    return stockStatus(p.stock);
  }
}
