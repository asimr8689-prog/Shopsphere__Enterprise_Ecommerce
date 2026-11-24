import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { catchError, filter, of, switchMap } from 'rxjs';
import { Category, Product } from '@core/models';
import { CategoryService } from '@core/services/category.service';
import { NotificationService } from '@core/services/notification.service';
import { ProductService } from '@core/services/product.service';
import { CustomValidators, validationMessage } from '@core/validators/custom-validators';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-categories-admin-page',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <header class="admin-head">
      <div>
        <h1>Categories</h1>
        <p>{{ categories().length }} categories. Categories that still contain products cannot be deleted.</p>
      </div>
    </header>

    <form class="panel cat-form" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <h2>{{ editing() ? 'Edit “' + editing()!.name + '”' : 'Add category' }}</h2>
      <div class="row">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
          <mat-error>{{ msg(form.controls.name, 'Name') }}</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Icon (Material Symbol)</mat-label>
          <input matInput formControlName="icon" />
          <mat-icon matSuffix>{{ form.controls.icon.value || 'category' }}</mat-icon>
        </mat-form-field>
        <mat-form-field class="grow">
          <mat-label>Description</mat-label>
          <input matInput formControlName="description" />
          <mat-error>{{ msg(form.controls.description, 'Description') }}</mat-error>
        </mat-form-field>
      </div>
      <div class="actions">
        @if (editing()) {
          <button mat-button type="button" (click)="cancel()">Cancel</button>
        }
        <button mat-flat-button type="submit">{{ editing() ? 'Save category' : 'Add category' }}</button>
      </div>
    </form>

    <div class="cat-grid">
      @for (c of categories(); track c.id) {
        <article class="panel cat">
          <span class="icon"><mat-icon>{{ c.icon }}</mat-icon></span>
          <div class="info">
            <strong>{{ c.name }}</strong>
            <small class="muted">{{ c.description }}</small>
            <span class="badge">{{ counts()[c.id] ?? 0 }} products</span>
          </div>
          <div class="btns">
            <button mat-icon-button type="button" (click)="edit(c)" [attr.aria-label]="'Edit ' + c.name"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button type="button" class="danger" (click)="remove(c)" [disabled]="(counts()[c.id] ?? 0) > 0" [attr.aria-label]="'Delete ' + c.name"><mat-icon>delete</mat-icon></button>
          </div>
        </article>
      }
    </div>
  `,
  styleUrl: './admin.scss',
  styles: `
    .cat-form { margin-bottom: 20px; } .row { display: flex; gap: 12px; flex-wrap: wrap; } .row mat-form-field { width: 220px; } .row .grow { flex: 1; min-width: 240px; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
    .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
    .cat { display: grid; grid-template-columns: 48px 1fr auto; gap: 12px; align-items: center; }
    .icon { width: 48px; height: 48px; border-radius: 12px; background: var(--ss-coral-soft); color: var(--ss-coral-strong); display: grid; place-items: center; }
    .info { display: flex; flex-direction: column; gap: 4px; } .info .badge { align-self: flex-start; }
    .btns { display: flex; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesAdminPage {
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly msg = validationMessage;

  readonly categories = toSignal(this.categoryService.categories$.pipe(catchError(() => of([] as Category[]))), { initialValue: [] as Category[] });
  private readonly products = toSignal(this.productService.products$.pipe(catchError(() => of([] as Product[]))), { initialValue: [] as Product[] });
  readonly counts = computed(() =>
    this.products().reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.categoryId]: (acc[p.categoryId] ?? 0) + 1 }), {}),
  );

  readonly editing = signal<Category | null>(null);
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), CustomValidators.notBlank]],
    icon: ['category'],
    description: ['', [Validators.required, Validators.maxLength(120)]],
  });

  edit(c: Category): void {
    this.editing.set(c);
    this.form.setValue({ name: c.name, icon: c.icon, description: c.description });
  }

  cancel(): void {
    this.editing.set(null);
    this.form.reset({ name: '', icon: 'category', description: '' });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const current = this.editing();
    const duplicate = this.categories().some((c) => c.name.toLowerCase() === v.name.trim().toLowerCase() && c.id !== current?.id);
    if (duplicate) {
      this.notify.error('A category with that name already exists.');
      return;
    }
    const req$ = current
      ? this.categoryService.update({ ...current, name: v.name.trim(), icon: v.icon || 'category', description: v.description.trim() })
      : this.categoryService.create({ name: v.name.trim(), icon: v.icon || 'category', description: v.description.trim() });
    req$.subscribe((c) => {
      this.notify.success(current ? `Updated “${c.name}”` : `Created “${c.name}”`);
      this.cancel();
    });
  }

  remove(c: Category): void {
    this.dialog
      .open(ConfirmDialogComponent, { data: { title: 'Delete category?', message: `“${c.name}” will be removed.`, confirmLabel: 'Delete', destructive: true } })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.categoryService.delete(c.id)),
      )
      .subscribe(() => this.notify.success(`Deleted “${c.name}”`));
  }
}
