import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '@core/services/user.service';
import { validationMessage } from '@core/validators/custom-validators';

@Component({
  selector: 'app-login-page',
  imports: [RouterLink, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule, MatIconModule],
  template: `
    <div class="container">
      <div class="auth">
        <div class="aside">
          <h2>Welcome back to ShopSphere</h2>
          <ul>
            <li>Track orders and deliveries</li>
            <li>Checkout faster with saved addresses</li>
            <li>Keep your wishlist in sync</li>
          </ul>
        </div>
        <div class="panel">
          <h1>Sign in</h1>
          <p>Use a demo account below or one you registered on this device.</p>
          @if (admin()) {
            <div class="demo-banner"><mat-icon>admin_panel_settings</mat-icon><span>The admin dashboard needs the demo <strong>admin</strong> account.</span></div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            @if (users.error(); as err) {
              <div class="error" role="alert"><mat-icon>error</mat-icon>{{ err }}</div>
            }
            <mat-form-field>
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="username" />
              <mat-error>{{ msg(form.controls.email, 'Email') }}</mat-error>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Password</mat-label>
              <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
              <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())" [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error>{{ msg(form.controls.password, 'Password') }}</mat-error>
            </mat-form-field>
            <div class="row">
              <mat-checkbox formControlName="remember">Remember me for 30 days</mat-checkbox>
            </div>
            <button mat-flat-button type="submit" class="submit" [disabled]="users.status() === 'loading'">
              {{ users.status() === 'loading' ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>

          <div class="demo-accounts">
            <span class="muted">Demo accounts (frontend-only authentication):</span>
            <button mat-stroked-button type="button" (click)="fill('demo@shopsphere.dev', 'Demo@1234')"><mat-icon>person</mat-icon> Customer · demo&#64;shopsphere.dev / Demo&#64;1234</button>
            <button mat-stroked-button type="button" (click)="fill('admin@shopsphere.dev', 'Admin@1234')"><mat-icon>admin_panel_settings</mat-icon> Admin · admin&#64;shopsphere.dev / Admin&#64;1234</button>
          </div>

          <p class="switch">New to ShopSphere? <a routerLink="/account/register" [queryParams]="{ returnUrl: returnUrl() }">Create an account</a></p>
        </div>
      </div>
    </div>
  `,
  styleUrl: './auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements OnInit {
  readonly users = inject(UserService);
  private readonly fb = inject(FormBuilder).nonNullable;

  /** Query params bound via withComponentInputBinding(). */
  readonly returnUrl = input<string | undefined>(undefined);
  readonly admin = input<string | undefined>(undefined);

  readonly msg = validationMessage;
  readonly showPassword = signal(false);
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true],
  });

  ngOnInit(): void {
    this.users.clearError();
  }

  fill(email: string, password: string): void {
    this.form.patchValue({ email, password });
    this.submit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.users.signIn(this.form.getRawValue(), this.returnUrl());
  }
}
