import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { environment } from '@env/environment';
import { CartService } from '@core/services/cart.service';
import { ImgFallbackDirective } from '../../directives/img-fallback.directive';

/** Cart totals + coupon box, reused by the cart page and the checkout sidebar. */
@Component({
  selector: 'app-order-summary',
  imports: [CurrencyPipe, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatProgressBarModule, ImgFallbackDirective],
  template: `
    <h2>{{ heading() }}</h2>

    @if (showItems()) {
      <ul class="items">
        @for (item of cart.items(); track item.productId) {
          <li>
            <span class="thumb"><img [src]="item.image" alt="" appImgFallback width="56" height="56" /><span class="qty">{{ item.quantity }}</span></span>
            <span class="name">{{ item.name }}</span>
            <span>{{ item.price * item.quantity | currency: 'USD' }}</span>
          </li>
        }
      </ul>
    }

    @if (totals().itemCount && totals().freeShippingRemaining > 0 && cart.deliveryOption().id === 'standard') {
      <div class="free-ship">
        <span>Add <strong>{{ totals().freeShippingRemaining | currency: 'USD' }}</strong> for free standard delivery</span>
        <mat-progress-bar mode="determinate" [value]="freeShippingProgress()" />
      </div>
    }

    <!-- Coupon -->
    @if (cart.coupon(); as coupon) {
      <div class="coupon-applied">
        <mat-icon>sell</mat-icon>
        <div><strong>{{ coupon.code }}</strong><small>{{ coupon.description }}</small></div>
        <button mat-button type="button" (click)="cart.removeCoupon()">Remove</button>
      </div>
      @if (cart.couponWarning(); as warning) {
        <p class="warn">{{ warning }}</p>
      }
    } @else if (allowCoupon()) {
      <form class="coupon" (submit)="$event.preventDefault(); apply()" novalidate>
        <mat-form-field>
          <mat-label>Coupon code</mat-label>
          <input matInput [formControl]="couponCode" autocomplete="off" />
          @if (cart.couponError(); as err) {
            <mat-hint class="err">{{ err }}</mat-hint>
          } @else {
            <mat-hint>Try SAVE10, WELCOME20, FLAT25 or FREESHIP</mat-hint>
          }
        </mat-form-field>
        <button mat-stroked-button type="submit" [disabled]="couponCode.invalid || cart.couponStatus() === 'applying'">
          {{ cart.couponStatus() === 'applying' ? 'Applying…' : 'Apply' }}
        </button>
      </form>
    }

    <div class="rows">
      <div class="summary-row"><span>Subtotal ({{ totals().itemCount }} {{ totals().itemCount === 1 ? 'item' : 'items' }})</span><span>{{ totals().subtotal | currency: 'USD' }}</span></div>
      @if (totals().productSavings > 0) {
        <div class="summary-row"><span>Sale savings</span><span class="saving">−{{ totals().productSavings | currency: 'USD' }}</span></div>
      }
      @if (totals().couponDiscount > 0) {
        <div class="summary-row"><span>Coupon discount</span><span class="saving">−{{ totals().couponDiscount | currency: 'USD' }}</span></div>
      }
      <div class="summary-row">
        <span>{{ cart.deliveryOption().label }}</span>
        <span>{{ totals().shipping === 0 ? 'Free' : (totals().shipping | currency: 'USD') }}</span>
      </div>
      <div class="summary-row"><span>Estimated tax ({{ taxPercent }}%)</span><span>{{ totals().tax | currency: 'USD' }}</span></div>
      <div class="summary-row total"><span>Total</span><span>{{ totals().total | currency: 'USD' }}</span></div>
    </div>

    <ng-content />
  `,
  styles: `
    :host { display: block; background: var(--ss-surface); border: 1px solid var(--ss-line); border-radius: var(--ss-radius-lg); padding: var(--ss-space-5); }
    h2 { font-size: 1.2rem; }
    .items { list-style: none; padding: 0; margin: 0 0 16px; display: grid; gap: 12px; max-height: 280px; overflow-y: auto; }
    .items li { display: grid; grid-template-columns: 56px 1fr auto; gap: 12px; align-items: center; font-size: 14px; }
    .thumb { position: relative; } .thumb img { width: 56px; height: 56px; border-radius: 10px; }
    .qty { position: absolute; top: -6px; right: -6px; background: var(--ss-ink); color: #fff; border-radius: 999px; font-size: 11px; min-width: 20px; height: 20px; display: grid; place-items: center; }
    .name { font-weight: 500; }
    .free-ship { background: var(--ss-coral-soft); border-radius: var(--ss-radius-sm); padding: 12px; font-size: 13px; margin-bottom: 16px; display: grid; gap: 8px; }
    .coupon { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 8px; } .coupon button { height: 56px; }
    .err { color: var(--ss-danger); }
    .coupon-applied { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px dashed var(--ss-success); background: var(--ss-success-soft); border-radius: var(--ss-radius-sm); margin-bottom: 12px; }
    .coupon-applied div { flex: 1; display: flex; flex-direction: column; } .coupon-applied small { color: var(--ss-text-muted); }
    .coupon-applied mat-icon { color: var(--ss-success); }
    .warn { color: var(--ss-warning); font-size: 13px; margin: 0 0 12px; }
    .rows { margin-top: 8px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSummaryComponent {
  readonly cart = inject(CartService);
  readonly heading = input('Order summary');
  readonly showItems = input(false);
  readonly allowCoupon = input(true);

  readonly totals = this.cart.totals;
  readonly taxPercent = Math.round(environment.taxRate * 100);
  readonly couponCode = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] });

  readonly freeShippingProgress = computed(() => {
    const t = this.totals();
    const threshold = environment.freeShippingThreshold;
    return Math.min(100, ((threshold - t.freeShippingRemaining) / threshold) * 100);
  });

  apply(): void {
    if (this.couponCode.valid) this.cart.applyCoupon(this.couponCode.value);
  }
}
