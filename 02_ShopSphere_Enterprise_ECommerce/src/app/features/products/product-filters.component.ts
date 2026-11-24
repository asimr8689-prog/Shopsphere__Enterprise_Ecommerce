import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Category, ProductQuery } from '@core/models';
import { RatingStarsComponent } from '@shared/components/rating-stars/rating-stars.component';

/**
 * Presentational filter panel. Receives the current query via input() and reports changes via
 * output() – the parent page owns URL state (parent ↔ child component communication).
 */
@Component({
  selector: 'app-product-filters',
  imports: [
    ReactiveFormsModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RatingStarsComponent,
  ],
  template: `
    <div class="head">
      <h2>Filters</h2>
      @if (activeCount()) {
        <button mat-button type="button" (click)="clearAll.emit()">Clear all ({{ activeCount() }})</button>
      }
    </div>

    <fieldset>
      <legend>Category</legend>
      @for (c of categories(); track c.id) {
        <mat-checkbox [checked]="query().categories.includes(c.id)" (change)="toggle('categories', c.id)">{{ c.name }}</mat-checkbox>
      }
    </fieldset>

    <fieldset>
      <legend>Brand</legend>
      @for (b of brands(); track b) {
        <mat-checkbox [checked]="query().brands.includes(b)" (change)="toggle('brands', b)">{{ b }}</mat-checkbox>
      }
    </fieldset>

    <fieldset [formGroup]="priceForm">
      <legend>Price (USD)</legend>
      <div class="price-row">
        <mat-form-field>
          <mat-label>Min</mat-label>
          <input matInput type="number" min="0" formControlName="min" [placeholder]="'' + priceBounds().min" />
        </mat-form-field>
        <span>–</span>
        <mat-form-field>
          <mat-label>Max</mat-label>
          <input matInput type="number" min="0" formControlName="max" [placeholder]="'' + priceBounds().max" />
        </mat-form-field>
      </div>
      <div class="quick-prices">
        @for (r of priceRanges; track r.label) {
          <button type="button" class="chip" (click)="setPrice(r.min, r.max)"
            [class.active]="query().minPrice === r.min && query().maxPrice === r.max">{{ r.label }}</button>
        }
      </div>
    </fieldset>

    <fieldset>
      <legend>Customer rating</legend>
      <mat-radio-group [value]="query().minRating" (change)="changed.emit({ minRating: $event.value })" aria-label="Minimum rating">
        @for (r of [4.5, 4, 3]; track r) {
          <mat-radio-button [value]="r"><app-rating-stars [rating]="r" /> &amp; up</mat-radio-button>
        }
        <mat-radio-button [value]="null">Any rating</mat-radio-button>
      </mat-radio-group>
    </fieldset>

    <fieldset>
      <legend>Availability</legend>
      <mat-slide-toggle [checked]="query().inStockOnly" (change)="changed.emit({ inStockOnly: $event.checked })">In stock only</mat-slide-toggle>
      <mat-slide-toggle [checked]="query().onSaleOnly" (change)="changed.emit({ onSaleOnly: $event.checked })">On sale</mat-slide-toggle>
    </fieldset>
  `,
  styles: `
    :host { display: block; }
    .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    h2 { font-size: 1.1rem; margin: 0; }
    fieldset { border: 0; border-top: 1px solid var(--ss-line); margin: 0; padding: 16px 0; display: flex; flex-direction: column; gap: 2px; }
    legend { font-weight: 700; color: var(--ss-ink); padding: 0; margin-bottom: 6px; float: left; width: 100%; }
    .price-row { display: flex; align-items: center; gap: 8px; }
    .quick-prices { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .chip { border: 1px solid var(--ss-line); background: var(--ss-surface); border-radius: 999px; padding: 4px 12px; font: inherit; font-size: 13px; cursor: pointer; }
    .chip.active, .chip:hover { border-color: var(--ss-coral); color: var(--ss-coral-strong); background: var(--ss-coral-soft); }
    mat-radio-group { display: flex; flex-direction: column; }
    mat-slide-toggle { margin: 6px 0; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFiltersComponent {
  readonly query = input.required<ProductQuery>();
  readonly categories = input<Category[]>([]);
  readonly brands = input<string[]>([]);
  readonly priceBounds = input<{ min: number; max: number }>({ min: 0, max: 0 });
  readonly activeCount = input(0);

  readonly changed = output<Partial<ProductQuery>>();
  readonly clearAll = output<void>();

  readonly priceRanges = [
    { label: 'Under $100', min: null, max: 100 },
    { label: '$100–$500', min: 100, max: 500 },
    { label: '$500–$1,000', min: 500, max: 1000 },
    { label: '$1,000+', min: 1000, max: null },
  ];

  readonly priceForm = new FormGroup({
    min: new FormControl<number | null>(null),
    max: new FormControl<number | null>(null),
  });

  constructor() {
    // Keep the price inputs in sync with the URL (e.g. after "Clear all") without re-emitting.
    effect(() => {
      const q = this.query();
      this.priceForm.setValue({ min: q.minPrice, max: q.maxPrice }, { emitEvent: false });
    });

    this.priceForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged((a, b) => a.min === b.min && a.max === b.max),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(({ min, max }) => {
        const toNum = (v: number | null | undefined) => (v === null || v === undefined || `${v}` === '' ? null : Math.max(0, Number(v)));
        let lo = toNum(min);
        let hi = toNum(max);
        if (lo != null && hi != null && lo > hi) [lo, hi] = [hi, lo];
        this.changed.emit({ minPrice: lo, maxPrice: hi });
      });
  }

  toggle(key: 'categories' | 'brands', value: string): void {
    const current = this.query()[key];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    this.changed.emit(key === 'categories' ? { categories: next } : { brands: next });
  }

  setPrice(min: number | null, max: number | null): void {
    this.changed.emit({ minPrice: min, maxPrice: max });
  }
}
