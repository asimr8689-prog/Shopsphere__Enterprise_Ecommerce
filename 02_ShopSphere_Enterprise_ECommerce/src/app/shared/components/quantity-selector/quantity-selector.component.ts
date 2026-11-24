import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/** Two-way bound quantity stepper: <app-quantity-selector [(value)]="qty" [max]="stock" />. */
@Component({
  selector: 'app-quantity-selector',
  imports: [MatIconModule, MatButtonModule],
  template: `
    <button mat-icon-button type="button" (click)="set(value() - 1)" [disabled]="disabled() || value() <= min()" aria-label="Decrease quantity">
      <mat-icon>remove</mat-icon>
    </button>
    <input
      type="number"
      inputmode="numeric"
      [min]="min()"
      [max]="max()"
      [value]="value()"
      [disabled]="disabled()"
      (change)="set(+$any($event.target).value)"
      [attr.aria-label]="label()"
    />
    <button mat-icon-button type="button" (click)="set(value() + 1)" [disabled]="disabled() || value() >= max()" aria-label="Increase quantity">
      <mat-icon>add</mat-icon>
    </button>
  `,
  styles: `
    :host { display: inline-flex; align-items: center; border: 1px solid var(--ss-line); border-radius: var(--ss-radius-pill); background: var(--ss-surface); }
    input { width: 44px; border: 0; text-align: center; font: inherit; font-weight: 600; background: transparent; color: var(--ss-ink); -moz-appearance: textfield; }
    input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    button { --mdc-icon-button-state-layer-size: 36px; --mat-icon-button-state-layer-size: 36px; padding: 6px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuantitySelectorComponent {
  readonly value = model(1);
  readonly min = input(1);
  readonly max = input(99);
  readonly disabled = input(false);
  readonly label = input('Quantity');

  set(next: number): void {
    const clamped = Math.max(this.min(), Math.min(this.max(), Math.floor(Number.isFinite(next) ? next : this.min())));
    this.value.set(clamped);
  }
}
