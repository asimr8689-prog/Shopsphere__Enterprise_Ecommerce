import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Product, stockStatus } from '@core/models';
import { CartService } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { ImgFallbackDirective } from '../../directives/img-fallback.directive';
import { DiscountPipe } from '../../pipes/discount.pipe';
import { PriceTagComponent } from '../price-tag/price-tag.component';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, MatIconModule, MatButtonModule, MatTooltipModule, ImgFallbackDirective, DiscountPipe, PriceTagComponent, RatingStarsComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  private readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);

  readonly product = input.required<Product>();
  /** Optional category label resolved by the parent. */
  readonly categoryName = input<string>('');

  readonly stock = computed(() => stockStatus(this.product().stock));
  readonly isWishlisted = computed(() => this.wishlist.ids().includes(this.product().id));
  readonly inCart = computed(() => this.cart.items().find((i) => i.productId === this.product().id)?.quantity ?? 0);

  addToCart(): void {
    this.cart.add(this.product(), 1);
  }

  toggleWishlist(): void {
    this.wishlist.toggle(this.product().id);
  }
}
