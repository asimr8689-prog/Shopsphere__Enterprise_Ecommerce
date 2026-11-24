import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { Category, Product, ProductTag } from '@core/models';
import { errorMessage } from '@core/services/api';
import { ProductService } from '@core/services/product.service';
import { CustomValidators, validationMessage } from '@core/validators/custom-validators';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';

export interface ProductFormData {
  product: Product | null;
  categories: Category[];
  /** Existing images per category, offered as image choices for new products (no upload backend). */
  imageOptions: Record<string, string[]>;
}

@Component({
  selector: 'app-product-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, ImgFallbackDirective],
  template: `
    <h2 mat-dialog-title>{{ data.product ? 'Edit product' : 'Add product' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" id="product-form" (ngSubmit)="save()" novalidate>
        <div class="form-grid">
          <mat-form-field class="span-2">
            <mat-label>Product name</mat-label>
            <input matInput formControlName="name" />
            <mat-error>{{ msg(form.controls.name, 'Name') }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Brand</mat-label>
            <input matInput formControlName="brand" />
            <mat-error>{{ msg(form.controls.brand, 'Brand') }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Category</mat-label>
            <mat-select formControlName="categoryId">
              @for (c of data.categories; track c.id) {
                <mat-option [value]="c.id">{{ c.name }}</mat-option>
              }
            </mat-select>
            <mat-error>Category is required</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Price (USD)</mat-label>
            <input matInput type="number" min="0" step="0.01" formControlName="price" />
            <mat-error>{{ msg(form.controls.price, 'Price') }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Compare-at price (optional)</mat-label>
            <input matInput type="number" min="0" step="0.01" formControlName="compareAtPrice" />
            <mat-hint>Original price – shows a sale badge</mat-hint>
          </mat-form-field>
          @if (form.hasError('compareAtNotAbovePrice')) {
            <p class="span-2 error">Compare-at price must be higher than the selling price.</p>
          }
          <mat-form-field>
            <mat-label>Stock</mat-label>
            <input matInput type="number" min="0" step="1" formControlName="stock" />
            <mat-error>{{ msg(form.controls.stock, 'Stock') }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Tags</mat-label>
            <mat-select formControlName="tags" multiple>
              @for (t of tagOptions; track t) {
                <mat-option [value]="t">{{ t }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field class="span-2">
            <mat-label>Short description</mat-label>
            <input matInput formControlName="shortDescription" maxlength="140" />
            <mat-hint align="end">{{ form.controls.shortDescription.value.length }}/140</mat-hint>
            <mat-error>{{ msg(form.controls.shortDescription, 'Short description') }}</mat-error>
          </mat-form-field>
          <mat-form-field class="span-2">
            <mat-label>Full description</mat-label>
            <textarea matInput rows="3" formControlName="description"></textarea>
            <mat-error>{{ msg(form.controls.description, 'Description') }}</mat-error>
          </mat-form-field>
        </div>

        <h3>Image</h3>
        <p class="muted small">Image upload needs a backend; choose from existing catalogue artwork.</p>
        <div class="images">
          @for (img of imageChoices(); track img) {
            <button type="button" class="img-choice" [class.active]="form.controls.image.value === img" (click)="form.controls.image.setValue(img)">
              <img [src]="img" alt="" appImgFallback width="64" height="64" />
            </button>
          }
        </div>

        <h3>Specifications</h3>
        <div formArrayName="specs" class="specs">
          @for (spec of specs.controls; track spec; let i = $index) {
            <div [formGroupName]="i" class="spec-row">
              <mat-form-field><mat-label>Label</mat-label><input matInput formControlName="label" /></mat-form-field>
              <mat-form-field><mat-label>Value</mat-label><input matInput formControlName="value" /></mat-form-field>
              <button mat-icon-button type="button" (click)="specs.removeAt(i)" aria-label="Remove specification"><mat-icon>delete</mat-icon></button>
            </div>
          }
          <button mat-button type="button" (click)="addSpec()"><mat-icon>add</mat-icon> Add specification</button>
        </div>
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close [disabled]="saving()">Cancel</button>
      <button mat-flat-button type="submit" form="product-form" [disabled]="saving()">{{ saving() ? 'Saving…' : data.product ? 'Save changes' : 'Create product' }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    h3 { font-size: 0.95rem; margin: 16px 0 4px; } .small { font-size: 12.5px; margin: 0 0 8px; }
    .error { color: var(--ss-danger); font-size: 13px; margin: 0 0 8px; }
    .images { display: flex; flex-wrap: wrap; gap: 8px; }
    .img-choice { padding: 0; border: 2px solid transparent; border-radius: 10px; overflow: hidden; cursor: pointer; background: none; }
    .img-choice.active { border-color: var(--ss-coral); } .img-choice img { width: 64px; height: 64px; }
    .spec-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; align-items: center; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFormDialogComponent {
  readonly data = inject<ProductFormData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ProductFormDialogComponent, Product>);
  private readonly products = inject(ProductService);
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly msg = validationMessage;
  readonly tagOptions: ProductTag[] = ['featured', 'trending', 'bestseller', 'new'];
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group(
    {
      name: [this.data.product?.name ?? '', [Validators.required, Validators.minLength(3), Validators.maxLength(80), CustomValidators.notBlank]],
      brand: [this.data.product?.brand ?? '', [Validators.required, CustomValidators.notBlank]],
      categoryId: [this.data.product?.categoryId ?? this.data.categories[0]?.id ?? '', Validators.required],
      price: [this.data.product?.price ?? 0, [Validators.required, Validators.min(0.5), Validators.max(100000)]],
      compareAtPrice: [this.data.product?.compareAtPrice ?? (null as number | null)],
      stock: [this.data.product?.stock ?? 10, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
      tags: [this.data.product?.tags ?? ([] as ProductTag[])],
      shortDescription: [this.data.product?.shortDescription ?? '', [Validators.required, Validators.maxLength(140)]],
      description: [this.data.product?.description ?? '', [Validators.required, Validators.minLength(20)]],
      image: [this.data.product?.images[0] ?? ''],
      specs: this.fb.array(
        (this.data.product?.specs ?? [{ label: '', value: '' }]).map((s) =>
          this.fb.group({ label: [s.label, Validators.required], value: [s.value, Validators.required] }),
        ),
      ),
    },
    { validators: CustomValidators.compareAtAbovePrice() },
  );

  get specs(): FormArray {
    return this.form.controls.specs;
  }

  imageChoices(): string[] {
    const cat = this.form.controls.categoryId.value;
    const options = this.data.imageOptions[cat] ?? [];
    const current = this.form.controls.image.value;
    return current && !options.includes(current) ? [current, ...options] : options;
  }

  addSpec(): void {
    this.form.controls.specs.push(this.fb.group({ label: ['', Validators.required], value: ['', Validators.required] }));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const image = v.image || this.imageChoices()[0] || 'images/placeholder.svg';
    const existing = this.data.product;
    const images = existing ? [image, ...existing.images.filter((i) => i !== image)] : [image];
    const compareAt = v.compareAtPrice === null || `${v.compareAtPrice}` === '' ? null : Number(v.compareAtPrice);
    const base = {
      name: v.name.trim(),
      brand: v.brand.trim(),
      categoryId: v.categoryId,
      price: Number(v.price),
      compareAtPrice: compareAt,
      stock: Number(v.stock),
      tags: v.tags,
      shortDescription: v.shortDescription.trim(),
      description: v.description.trim(),
      images,
      specs: v.specs.filter((s) => s.label.trim() && s.value.trim()),
    };

    this.saving.set(true);
    const request$: Observable<Product> = existing ? this.products.update({ ...existing, ...base }) : this.products.create(base);
    request$.subscribe({
      next: (product) => this.ref.close(product),
      error: (err) => {
        this.saving.set(false);
        this.error.set(errorMessage(err));
      },
    });
  }
}
