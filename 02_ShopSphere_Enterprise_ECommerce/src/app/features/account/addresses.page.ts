import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { Address, COUNTRIES } from '@core/models';
import { uid } from '@core/services/api';
import { UserService } from '@core/services/user.service';
import { CustomValidators, validationMessage } from '@core/validators/custom-validators';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '@shared/components/state/state.components';

@Component({
  selector: 'app-addresses-page',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule, MatButtonModule, MatIconModule, EmptyStateComponent],
  template: `
    <div class="head">
      <div>
        <h1 class="page-title">Addresses</h1>
        <p class="page-subtitle">Saved addresses appear at checkout.</p>
      </div>
      @if (!editing()) {
        <button mat-flat-button type="button" (click)="startAdd()"><mat-icon>add</mat-icon> Add address</button>
      }
    </div>

    @if (editing()) {
      <form class="card editor" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <h2>{{ editingId() ? 'Edit address' : 'New address' }}</h2>
        <div class="form-grid">
          <mat-form-field>
            <mat-label>Label</mat-label>
            <input matInput formControlName="label" placeholder="Home, Office…" />
            <mat-error>{{ msg(form.controls.label, 'Label') }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Full name</mat-label>
            <input matInput formControlName="fullName" autocomplete="name" />
            <mat-error>{{ msg(form.controls.fullName, 'Full name') }}</mat-error>
          </mat-form-field>
          <mat-form-field class="span-2">
            <mat-label>Street address</mat-label>
            <input matInput formControlName="line1" autocomplete="address-line1" />
            <mat-error>{{ msg(form.controls.line1, 'Street address') }}</mat-error>
          </mat-form-field>
          <mat-form-field class="span-2">
            <mat-label>Apartment, suite (optional)</mat-label>
            <input matInput formControlName="line2" autocomplete="address-line2" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>City</mat-label>
            <input matInput formControlName="city" />
            <mat-error>{{ msg(form.controls.city, 'City') }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>State / Province</mat-label>
            <input matInput formControlName="state" />
            <mat-error>{{ msg(form.controls.state, 'State') }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Postal code</mat-label>
            <input matInput formControlName="postalCode" />
            <mat-error>{{ msg(form.controls.postalCode, 'Postal code') }}</mat-error>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Country</mat-label>
            <mat-select formControlName="country">
              @for (c of countries; track c) {
                <mat-option [value]="c">{{ c }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field class="span-2">
            <mat-label>Phone</mat-label>
            <input matInput type="tel" formControlName="phone" />
            <mat-error>{{ msg(form.controls.phone, 'Phone') }}</mat-error>
          </mat-form-field>
        </div>
        <mat-checkbox formControlName="isDefault">Set as default address</mat-checkbox>
        <div class="actions">
          <button mat-button type="button" (click)="cancel()">Cancel</button>
          <button mat-flat-button type="submit">Save address</button>
        </div>
      </form>
    }

    <div class="grid">
      @for (a of users.user()?.addresses ?? []; track a.id) {
        <article class="address" [class.default]="a.isDefault">
          <header>
            <strong>{{ a.label }}</strong>
            @if (a.isDefault) { <span class="badge success">Default</span> }
          </header>
          <p>{{ a.fullName }}<br />{{ a.line1 }}{{ a.line2 ? ', ' + a.line2 : '' }}<br />{{ a.city }}, {{ a.state }} {{ a.postalCode }}<br />{{ a.country }}<br />{{ a.phone }}</p>
          <footer>
            <button mat-button type="button" (click)="startEdit(a)"><mat-icon>edit</mat-icon> Edit</button>
            @if (!a.isDefault) {
              <button mat-button type="button" (click)="users.setDefaultAddress(a.id)">Make default</button>
            }
            <button mat-button type="button" class="danger" (click)="remove(a)"><mat-icon>delete</mat-icon> Delete</button>
          </footer>
        </article>
      } @empty {
        @if (!editing()) {
          <app-empty-state icon="home_pin" title="No saved addresses" message="Add an address to speed up checkout." />
        }
      }
    </div>
  `,
  styles: `
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
    .editor { margin-bottom: 24px; } h2 { font-size: 1.1rem; }
    .actions { display: flex; justify-content: flex-end; gap: 12px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .address { background: var(--ss-surface); border: 1px solid var(--ss-line); border-radius: var(--ss-radius); padding: 18px; display: flex; flex-direction: column; }
    .address.default { border-color: var(--ss-success); }
    .address header { display: flex; justify-content: space-between; align-items: center; }
    .address p { color: var(--ss-ink-2); font-size: 14px; flex: 1; }
    .address footer { display: flex; flex-wrap: wrap; margin-left: -10px; }
    .danger { --mat-button-text-label-text-color: var(--ss-danger); --mdc-text-button-label-text-color: var(--ss-danger); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressesPage {
  readonly users = inject(UserService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly countries = COUNTRIES;
  readonly msg = validationMessage;
  readonly editing = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.group({
    label: ['Home', [Validators.required, Validators.maxLength(30)]],
    fullName: ['', [Validators.required, CustomValidators.notBlank]],
    line1: ['', [Validators.required, Validators.minLength(5)]],
    line2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    postalCode: ['', [Validators.required, CustomValidators.postalCode]],
    country: ['United States', Validators.required],
    phone: ['', [Validators.required, CustomValidators.phone]],
    isDefault: [false],
  });

  startAdd(): void {
    const u = this.users.user();
    this.form.reset({ label: 'Home', fullName: u ? `${u.firstName} ${u.lastName}` : '', country: 'United States', phone: u?.phone ?? '', isDefault: !u?.addresses.length });
    this.editingId.set(null);
    this.editing.set(true);
  }

  startEdit(a: Address): void {
    this.form.reset({ ...a, line2: a.line2 ?? '' });
    this.editingId.set(a.id);
    this.editing.set(true);
  }

  cancel(): void {
    this.editing.set(false);
    this.editingId.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.users.saveAddress({ ...v, line2: v.line2 || undefined, id: this.editingId() ?? uid('a') });
    this.cancel();
  }

  remove(a: Address): void {
    this.dialog
      .open(ConfirmDialogComponent, { data: { title: 'Delete address?', message: `"${a.label}" will be removed from your account.`, confirmLabel: 'Delete', destructive: true } })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => this.users.deleteAddress(a.id));
  }
}
