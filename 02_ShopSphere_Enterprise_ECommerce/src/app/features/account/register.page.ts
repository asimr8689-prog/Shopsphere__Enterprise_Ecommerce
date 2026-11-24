import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '@core/services/user.service';
import { CustomValidators, validationMessage } from '@core/validators/custom-validators';

@Component({
  selector: 'app-register-page',
  imports: [RouterLink, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule, MatIconModule],
  template: `
    <div class="container">
      <div class="auth">
        <div class="aside">
          <h2>Join ShopSphere</h2>
          <ul>
            <li>10% off your first order with SAVE10</li>
            <li>Order history and live tracking</li>
            <li>Saved addresses for one-click checkout</li>
          </ul>
        </div>
        <div class="panel">
          <h1>Create account</h1>
          <p>Demo registration – your account is stored only in this browser.</p>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            @if (users.error(); as err) {
              <div class="error" role="alert"><mat-icon>error</mat-icon>{{ err }}</div>
            }
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
            </div>
            <mat-form-field>
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              <mat-error>{{ msg(form.controls.email, 'Email') }}</mat-error>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Phone (optional)</mat-label>
              <input matInput type="tel" formControlName="phone" autocomplete="tel" />
              <mat-error>{{ msg(form.controls.phone, 'Phone') }}</mat-error>
            </mat-form-field>
            <div formGroupName="passwords">
              <mat-form-field>
                <mat-label>Password</mat-label>
                <input matInput type="password" formControlName="password" autocomplete="new-password" />
                <mat-error>{{ msg(form.controls.passwords.controls.password, 'Password') }}</mat-error>
              </mat-form-field>
              <div class="strength" aria-hidden="true">
                @for (i of [1, 2, 3, 4, 5]; track i) {
                  <span [class.on]="strength().score >= i" [class]="strength().label"></span>
                }
              </div>
              <ul class="rules" aria-label="Password requirements">
                @for (r of strength().rules; track r.label) {
                  <li [class.ok]="r.ok">{{ r.ok ? '✓' : '•' }} {{ r.label }}</li>
                }
              </ul>
              <mat-form-field>
                <mat-label>Confirm password</mat-label>
                <input matInput type="password" formControlName="confirm" autocomplete="new-password" />
                @if (form.controls.passwords.hasError('fieldsMismatch')) {
                  <mat-hint class="mismatch">Passwords do not match</mat-hint>
                }
                <mat-error>{{ msg(form.controls.passwords.controls.confirm, 'Confirmation') }}</mat-error>
              </mat-form-field>
            </div>
            <mat-checkbox formControlName="newsletter">Email me deals and new arrivals</mat-checkbox>
            <mat-checkbox formControlName="terms">I agree to the demo terms &amp; privacy notice</mat-checkbox>
            @if (form.controls.terms.invalid && form.controls.terms.touched) {
              <span class="mismatch">You must accept the terms to continue.</span>
            }
            <button mat-flat-button type="submit" class="submit" [disabled]="users.status() === 'loading'">
              {{ users.status() === 'loading' ? 'Creating account…' : 'Create account' }}
            </button>
          </form>
          <p class="switch">Already have an account? <a routerLink="/account/login" [queryParams]="{ returnUrl: returnUrl() }">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styleUrl: './auth.scss',
  styles: `.mismatch { color: var(--ss-danger); font-size: 12.5px; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage implements OnInit {
  readonly users = inject(UserService);
  private readonly fb = inject(FormBuilder).nonNullable;
  readonly returnUrl = input<string | undefined>(undefined);
  readonly msg = validationMessage;

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(40), CustomValidators.notBlank]],
    lastName: ['', [Validators.required, Validators.maxLength(40), CustomValidators.notBlank]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', CustomValidators.phone],
    passwords: this.fb.group(
      {
        password: ['', [Validators.required, CustomValidators.strongPassword]],
        confirm: ['', Validators.required],
      },
      { validators: CustomValidators.matchFields('password', 'confirm') },
    ),
    newsletter: [true],
    terms: [false, Validators.requiredTrue],
  });

  private readonly password = toSignal(this.form.controls.passwords.controls.password.valueChanges, { initialValue: '' });

  /** Live password strength meter derived from the same rules as the validator. */
  readonly strength = computed(() => {
    const v = this.password();
    const rules = [
      { label: '8+ characters', ok: v.length >= 8 },
      { label: 'Uppercase', ok: /[A-Z]/.test(v) },
      { label: 'Lowercase', ok: /[a-z]/.test(v) },
      { label: 'Number', ok: /\d/.test(v) },
      { label: 'Symbol', ok: /[^A-Za-z0-9]/.test(v) },
    ];
    const score = rules.filter((r) => r.ok).length;
    return { rules, score, label: score <= 2 ? 'weak' : score <= 4 ? 'fair' : 'strong' };
  });

  ngOnInit(): void {
    this.users.clearError();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.users.registerAndSignIn(
      {
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        phone: v.phone || undefined,
        password: v.passwords.password,
        newsletter: v.newsletter,
      },
      this.returnUrl(),
    );
  }
}
