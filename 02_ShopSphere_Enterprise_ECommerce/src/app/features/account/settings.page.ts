import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { UserPreferences } from '@core/models';
import { errorMessage } from '@core/services/api';
import { NotificationService } from '@core/services/notification.service';
import { StorageService } from '@core/services/storage.service';
import { UserService } from '@core/services/user.service';
import { CustomValidators, validationMessage } from '@core/validators/custom-validators';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule, MatSlideToggleModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <h1 class="page-title">Account settings</h1>
    <p class="page-subtitle">Notifications, security and demo data.</p>

    <section class="card">
      <h2>Notifications</h2>
      @if (users.user(); as u) {
        @for (p of prefs; track p.key) {
          <div class="pref">
            <div><strong>{{ p.label }}</strong><span class="muted">{{ p.hint }}</span></div>
            <mat-slide-toggle [checked]="u.preferences[p.key]" (change)="setPref(p.key, $event.checked)" [attr.aria-label]="p.label" />
          </div>
        }
      }
    </section>

    <section class="card">
      <h2>Change password</h2>
      <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" novalidate class="pw">
        <mat-form-field>
          <mat-label>Current password</mat-label>
          <input matInput type="password" formControlName="current" autocomplete="current-password" />
          <mat-error>{{ msg(passwordForm.controls.current, 'Current password') }}</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>New password</mat-label>
          <input matInput type="password" formControlName="next" autocomplete="new-password" />
          <mat-error>{{ msg(passwordForm.controls.next, 'New password') }}</mat-error>
        </mat-form-field>
        <mat-form-field>
          <mat-label>Confirm new password</mat-label>
          <input matInput type="password" formControlName="confirm" autocomplete="new-password" />
          @if (passwordForm.hasError('fieldsMismatch')) {
            <mat-hint class="danger-text">Passwords do not match</mat-hint>
          }
        </mat-form-field>
        <div class="actions">
          <button mat-flat-button type="submit" [disabled]="savingPassword()">{{ savingPassword() ? 'Updating…' : 'Update password' }}</button>
        </div>
      </form>
    </section>

    <section class="card danger-zone">
      <h2>Demo data</h2>
      <p class="muted">Clear everything ShopSphere stored in this browser: cart, wishlist, registered accounts, placed orders and admin edits.</p>
      <button mat-stroked-button type="button" class="danger" (click)="resetDemo()"><mat-icon>restart_alt</mat-icon> Reset demo data</button>
    </section>
  `,
  styles: `
    .card { margin-bottom: 20px; } h2 { font-size: 1.1rem; }
    .pref { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--ss-line); }
    .pref:last-child { border-bottom: 0; }
    .pref div { display: flex; flex-direction: column; } .pref span { font-size: 13px; }
    .pw { max-width: 440px; display: grid; }
    .actions { display: flex; justify-content: flex-start; }
    .danger-text { color: var(--ss-danger); }
    .danger { --mat-button-outlined-label-text-color: var(--ss-danger); --mdc-outlined-button-label-text-color: var(--ss-danger); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  readonly users = inject(UserService);
  private readonly notify = inject(NotificationService);
  private readonly storage = inject(StorageService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly msg = validationMessage;
  readonly savingPassword = signal(false);

  readonly prefs: { key: keyof UserPreferences; label: string; hint: string }[] = [
    { key: 'orderUpdates', label: 'Order updates', hint: 'Shipping and delivery notifications' },
    { key: 'newsletter', label: 'Newsletter', hint: 'Deals, launches and buying guides' },
    { key: 'smsAlerts', label: 'SMS alerts', hint: 'Text message when your order is out for delivery' },
  ];

  readonly passwordForm = this.fb.group(
    {
      current: ['', Validators.required],
      next: ['', [Validators.required, CustomValidators.strongPassword]],
      confirm: ['', Validators.required],
    },
    { validators: CustomValidators.matchFields('next', 'confirm') },
  );

  setPref(key: keyof UserPreferences, value: boolean): void {
    const u = this.users.user();
    if (u) this.users.updateProfile({ preferences: { ...u.preferences, [key]: value } }, 'Preferences saved');
  }

  changePassword(): void {
    const u = this.users.user();
    if (!u || this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { current, next } = this.passwordForm.getRawValue();
    this.savingPassword.set(true);
    this.users.changePassword(u.id, current, next).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordForm.reset();
        this.notify.success('Password updated (stored locally for this demo)');
      },
      error: (err) => {
        this.savingPassword.set(false);
        this.notify.error(errorMessage(err));
      },
    });
  }

  resetDemo(): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Reset all demo data?', message: 'You will be signed out and the page will reload.', confirmLabel: 'Reset', destructive: true },
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.storage.clearAll();
        window.location.assign('/');
      });
  }
}
