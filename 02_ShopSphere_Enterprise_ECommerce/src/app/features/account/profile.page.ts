import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, map, of } from 'rxjs';
import { OrderService } from '@core/services/order.service';
import { UserService } from '@core/services/user.service';
import { CustomValidators, validationMessage } from '@core/validators/custom-validators';

@Component({
  selector: 'app-profile-page',
  imports: [RouterLink, CurrencyPipe, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <h1 class="page-title">My profile</h1>
    <p class="page-subtitle">Manage your personal details.</p>

    <div class="stats">
      <a class="stat" routerLink="/account/orders"><mat-icon>receipt_long</mat-icon><strong>{{ stats().orders }}</strong><span>Orders</span></a>
      <div class="stat"><mat-icon>payments</mat-icon><strong>{{ stats().spent | currency: 'USD' : 'symbol' : '1.0-0' }}</strong><span>Total spent</span></div>
      <a class="stat" routerLink="/account/addresses"><mat-icon>home_pin</mat-icon><strong>{{ users.user()?.addresses?.length ?? 0 }}</strong><span>Saved addresses</span></a>
    </div>

    <form class="card" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <h2>Personal information</h2>
      <div class="form-grid">
        <mat-form-field>
          <mat-label>First name</mat-label>
          <input matInput formControlName="firstName" autocomplete="given-name" />
          <mat-error>{{ msg(form.controls.firstName, 'First name') }}</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Last name</mat-label>
          <input matInput formControlName="lastName" autocomplete="family-name" />
          <mat-error>{{ msg(form.controls.lastName, 'Last name') }}</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" />
          <mat-error>{{ msg(form.controls.email, 'Email') }}</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Phone</mat-label>
          <input matInput type="tel" formControlName="phone" autocomplete="tel" />
          <mat-error>{{ msg(form.controls.phone, 'Phone') }}</mat-error>
        </mat-form-field>
      </div>
      <div class="actions">
        <button mat-button type="button" (click)="reset()" [disabled]="form.pristine">Discard changes</button>
        <button mat-flat-button type="submit" [disabled]="form.pristine || users.status() === 'loading'">
          {{ users.status() === 'loading' ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </form>
  `,
  styles: `
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat { display: flex; flex-direction: column; gap: 4px; padding: 18px; background: var(--ss-surface); border: 1px solid var(--ss-line); border-radius: var(--ss-radius); text-decoration: none; }
    .stat mat-icon { color: var(--ss-coral-strong); } .stat strong { font-size: 1.4rem; font-family: var(--ss-font-display); color: var(--ss-ink); } .stat span { color: var(--ss-text-muted); font-size: 13px; }
    h2 { font-size: 1.1rem; }
    .actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
    @media (max-width: 599px) { .stats { grid-template-columns: 1fr; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  readonly users = inject(UserService);
  private readonly orders = inject(OrderService);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly msg = validationMessage;

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, CustomValidators.notBlank]],
    lastName: ['', [Validators.required, CustomValidators.notBlank]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', CustomValidators.phone],
  });

  readonly stats = toSignal(
    this.orders.getForUser(this.users.user()?.id ?? '').pipe(
      map((list) => ({
        orders: list.length,
        spent: list.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
      })),
      catchError(() => of({ orders: 0, spent: 0 })),
    ),
    { initialValue: { orders: 0, spent: 0 } },
  );

  constructor() {
    // Re-sync the form whenever the stored profile changes (e.g. after a successful save).
    effect(() => {
      const u = this.users.user();
      if (u) this.form.reset({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone ?? '' });
    });
  }

  reset(): void {
    const u = this.users.user();
    if (u) this.form.reset({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone ?? '' });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.users.updateProfile({ ...v, firstName: v.firstName.trim(), lastName: v.lastName.trim(), email: v.email.trim().toLowerCase() });
  }
}
