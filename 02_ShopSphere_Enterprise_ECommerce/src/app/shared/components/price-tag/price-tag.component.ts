import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-price-tag',
  imports: [CurrencyPipe],
  template: `
    <span class="price" [class.sale]="onSale()">{{ price() | currency: 'USD' }}</span>
    @if (onSale()) {
      <span class="compare"><span class="visually-hidden">Was </span>{{ compareAtPrice() | currency: 'USD' }}</span>
      @if (showBadge()) {
        <span class="badge coral">-{{ percent() }}%</span>
      }
    }
  `,
  styles: `
    :host { display: inline-flex; align-items: baseline; flex-wrap: wrap; gap: 8px; }
    .price { font-family: var(--ss-font-display); font-weight: 800; color: var(--ss-ink); font-size: var(--price-size, 1.05rem); }
    .price.sale { color: var(--ss-coral-strong); }
    .compare { color: var(--ss-text-muted); text-decoration: line-through; font-size: 0.85em; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceTagComponent {
  readonly price = input.required<number>();
  readonly compareAtPrice = input<number | null | undefined>(null);
  readonly showBadge = input(true);

  readonly onSale = computed(() => !!this.compareAtPrice() && this.compareAtPrice()! > this.price());
  readonly percent = computed(() =>
    this.onSale() ? Math.round(((this.compareAtPrice()! - this.price()) / this.compareAtPrice()!) * 100) : 0,
  );
}
