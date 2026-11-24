import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { switchMap } from 'rxjs';
import { OrderService } from '@core/services/order.service';
import { UserService } from '@core/services/user.service';
import { loadableSignal } from '@core/utils/loadable';
import { EmptyStateComponent, ErrorStateComponent } from '@shared/components/state/state.components';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';

@Component({
  selector: 'app-order-confirmation-page',
  imports: [RouterLink, CurrencyPipe, DatePipe, MatButtonModule, MatIconModule, EmptyStateComponent, ErrorStateComponent, ImgFallbackDirective],
  template: `
    <div class="container page narrow">
      @if (order.state(); as s) {
        @if (s.status === 'error') {
          <app-error-state [message]="s.error ?? ''" (retry)="order.retry()" />
        } @else if (s.status === 'loading') {
          <p class="muted">Loading your order…</p>
        } @else if (s.data; as o) {
          <div class="hero">
            <div class="check"><mat-icon>check</mat-icon></div>
            <h1>Thank you, {{ o.customer.firstName }}!</h1>
            <p>Your order <strong>{{ o.number }}</strong> has been placed.</p>
            <div class="demo-banner"><mat-icon>info</mat-icon><span>This is a demo order. No payment was processed and nothing will be shipped.</span></div>
          </div>

          <div class="grid">
            <div class="card">
              <h2>Order details</h2>
              <ul class="items">
                @for (i of o.items; track i.productId) {
                  <li><img [src]="i.image" alt="" appImgFallback width="56" height="56" /><span>{{ i.name }} × {{ i.quantity }}</span><strong>{{ i.price * i.quantity | currency: 'USD' }}</strong></li>
                }
              </ul>
              <div class="summary-row"><span>Subtotal</span><span>{{ o.subtotal | currency: 'USD' }}</span></div>
              @if (o.discount) { <div class="summary-row"><span>Discount {{ o.couponCode ? '(' + o.couponCode + ')' : '' }}</span><span class="saving">−{{ o.discount | currency: 'USD' }}</span></div> }
              <div class="summary-row"><span>{{ o.delivery.label }}</span><span>{{ o.shipping ? (o.shipping | currency: 'USD') : 'Free' }}</span></div>
              <div class="summary-row"><span>Tax</span><span>{{ o.tax | currency: 'USD' }}</span></div>
              <div class="summary-row total"><span>Total</span><span>{{ o.total | currency: 'USD' }}</span></div>
            </div>
            <div class="card">
              <h2>Delivery</h2>
              <p><strong>Estimated arrival:</strong> {{ o.estimatedDelivery | date: 'EEEE, MMM d' }}</p>
              <p>{{ o.shippingAddress.fullName }}<br />{{ o.shippingAddress.line1 }}<br />{{ o.shippingAddress.city }}, {{ o.shippingAddress.state }} {{ o.shippingAddress.postalCode }}<br />{{ o.shippingAddress.country }}</p>
              <h2>Payment</h2>
              <p>{{ o.payment.method === 'card' ? 'Card ending ' + o.payment.cardLast4 : o.payment.method === 'paypal' ? 'PayPal (simulated)' : 'Cash on delivery' }}<br /><small class="muted">{{ o.payment.label }}</small></p>
            </div>
          </div>

          <div class="actions">
            @if (users.isLoggedIn()) {
              <a mat-flat-button [routerLink]="['/account/orders', o.id]"><mat-icon>local_shipping</mat-icon> Track this order</a>
            }
            <a mat-stroked-button routerLink="/products">Continue shopping</a>
          </div>
        } @else {
          <app-empty-state icon="receipt_long" title="Order not found" message="We couldn't find that order on this device.">
            <a mat-flat-button routerLink="/">Go home</a>
          </app-empty-state>
        }
      }
    </div>
  `,
  styles: `
    .narrow { max-width: 980px; }
    .hero { text-align: center; margin-bottom: var(--ss-space-6); }
    .hero h1 { font-size: clamp(1.8rem, 3vw, 2.4rem); }
    .hero .demo-banner { max-width: 520px; margin: 16px auto 0; text-align: left; }
    .check { width: 72px; height: 72px; margin: 0 auto 16px; border-radius: 50%; display: grid; place-items: center; background: var(--ss-success-soft); color: var(--ss-success); animation: pop 400ms var(--ss-ease); }
    .check mat-icon { font-size: 40px; width: 40px; height: 40px; }
    @keyframes pop { from { transform: scale(0.4); opacity: 0; } }
    .grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: var(--ss-space-5); }
    @media (max-width: 799px) { .grid { grid-template-columns: 1fr; } }
    h2 { font-size: 1.1rem; }
    .items { list-style: none; padding: 0; margin: 0 0 12px; display: grid; gap: 10px; }
    .items li { display: grid; grid-template-columns: 56px 1fr auto; gap: 12px; align-items: center; font-size: 14px; }
    .items img { width: 56px; height: 56px; border-radius: 10px; }
    .actions { display: flex; gap: 12px; justify-content: center; margin-top: var(--ss-space-6); flex-wrap: wrap; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderConfirmationPage {
  private readonly orders = inject(OrderService);
  readonly users = inject(UserService);
  readonly orderId = input.required<string>();
  private readonly orderId$ = toObservable(this.orderId);
  readonly order = loadableSignal(() => this.orderId$.pipe(switchMap((id) => this.orders.getById(id))));
}
