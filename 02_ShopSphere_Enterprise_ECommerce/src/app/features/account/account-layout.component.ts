import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '@core/services/user.service';

@Component({
  selector: 'app-account-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe, MatIconModule],
  template: `
    <div class="container page layout">
      <aside class="side">
        @if (users.user(); as u) {
          <div class="user">
            <span class="avatar" aria-hidden="true">{{ u.firstName[0] }}{{ u.lastName[0] }}</span>
            <div>
              <strong>{{ u.firstName }} {{ u.lastName }}</strong>
              <small>Member since {{ u.createdAt | date: 'MMM y' }}</small>
            </div>
          </div>
        }
        <nav aria-label="Account navigation">
          @for (l of links; track l.path) {
            <a [routerLink]="l.path" routerLinkActive="active"><mat-icon>{{ l.icon }}</mat-icon>{{ l.label }}</a>
          }
          <a routerLink="/wishlist"><mat-icon>favorite</mat-icon>Wishlist</a>
          @if (users.isAdmin()) {
            <a routerLink="/admin"><mat-icon>dashboard</mat-icon>Admin dashboard</a>
          }
          <button type="button" (click)="users.logout()"><mat-icon>logout</mat-icon>Sign out</button>
        </nav>
        <div class="demo-banner"><mat-icon>info</mat-icon><span>Demo authentication: data is stored in this browser only.</span></div>
      </aside>
      <section class="content"><router-outlet /></section>
    </div>
  `,
  styles: `
    .layout { display: grid; grid-template-columns: 260px 1fr; gap: var(--ss-space-6); align-items: start; }
    .side { position: sticky; top: calc(var(--ss-header-h) + 100px); display: grid; gap: 16px; }
    .user { display: flex; gap: 12px; align-items: center; padding: 16px; background: var(--ss-surface); border: 1px solid var(--ss-line); border-radius: var(--ss-radius); }
    .user div { display: flex; flex-direction: column; } .user small { color: var(--ss-text-muted); }
    .avatar { width: 46px; height: 46px; border-radius: 50%; background: var(--ss-ink); color: #fff; display: grid; place-items: center; font-weight: 700; text-transform: uppercase; }
    nav { display: grid; gap: 2px; }
    nav a, nav button { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: var(--ss-radius-sm); text-decoration: none; color: var(--ss-ink-2); font: inherit; font-weight: 500; border: 0; background: none; cursor: pointer; text-align: left; }
    nav a:hover, nav button:hover { background: var(--ss-surface-2); }
    nav a.active { background: var(--ss-coral-soft); color: var(--ss-coral-strong); font-weight: 700; }
    .content { min-width: 0; }
    @media (max-width: 899px) {
      .layout { grid-template-columns: 1fr; }
      .side { position: static; }
      nav { display: flex; overflow-x: auto; gap: 4px; }
      nav a, nav button { white-space: nowrap; }
      .demo-banner { display: none; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountLayoutComponent {
  readonly users = inject(UserService);
  readonly links = [
    { path: '/account/profile', label: 'Profile', icon: 'person' },
    { path: '/account/orders', label: 'Orders', icon: 'receipt_long' },
    { path: '/account/addresses', label: 'Addresses', icon: 'home_pin' },
    { path: '/account/settings', label: 'Settings', icon: 'settings' },
  ];
}
