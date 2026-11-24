import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialog } from '@angular/material/dialog';
import { filter, take } from 'rxjs';
import { CartItem, DELIVERY_OPTIONS, DeliveryOption } from '@core/models';
import { CartService } from '@core/services/cart.service';
import { WishlistService } from '@core/services/wishlist.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { OrderSummaryComponent } from '@shared/components/order-summary/order-summary.component';
import { QuantitySelectorComponent } from '@shared/components/quantity-selector/quantity-selector.component';
import { EmptyStateComponent } from '@shared/components/state/state.components';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';

@Component({
  selector: 'app-cart-page',
  imports: [
    RouterLink,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    OrderSummaryComponent,
    QuantitySelectorComponent,
    EmptyStateComponent,
    ImgFallbackDirective,
  ],
  templateUrl: './cart.page.html',
  styleUrl: './cart.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  readonly cart = inject(CartService);
  private readonly wishlist = inject(WishlistService);
  private readonly dialog = inject(MatDialog);

  readonly deliveryOptions = DELIVERY_OPTIONS;

  setQuantity(item: CartItem, quantity: number): void {
    this.cart.updateQuantity(item.productId, quantity);
  }

  remove(item: CartItem): void {
    this.cart.remove(item.productId);
  }

  saveForLater(item: CartItem): void {
    if (!this.wishlist.ids().includes(item.productId)) this.wishlist.toggle(item.productId);
    this.cart.remove(item.productId);
  }

  setDelivery(id: DeliveryOption['id']): void {
    this.cart.setDeliveryOption(id);
  }

  clearCart(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Empty your cart?', message: 'All items will be removed from your cart.', confirmLabel: 'Empty cart', destructive: true },
      })
      .afterClosed()
      .pipe(take(1), filter(Boolean))
      .subscribe(() => this.cart.clear());
  }
}
