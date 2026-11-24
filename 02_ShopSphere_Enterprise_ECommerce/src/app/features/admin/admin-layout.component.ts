import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { map } from 'rxjs';
import { LoadingService } from '@core/services/loading.service';
import { UserService } from '@core/services/user.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatIconModule, MatButtonModule, MatToolbarModule, MatProgressBarModule],
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav #nav [mode]="isMobile() ? 'over' : 'side'" [opened]="!isMobile()" class="sidenav">
        <a routerLink="/admin" class="brand">Shop<span>Sphere</span><small>Admin</small></a>
        <nav aria-label="Admin navigation">
          @for (l of links; track l.path) {
            <a [routerLink]="l.path" routerLinkActive="active" (click)="isMobile() && nav.close()"><mat-icon>{{ l.icon }}</mat-icon>{{ l.label }}</a>
          }
        </nav>
        <div class="side-footer">
          <a routerLink="/"><mat-icon>storefront</mat-icon>View storefront</a>
          <button type="button" (click)="users.logout()"><mat-icon>logout</mat-icon>Sign out</button>
        </div>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar class="toolbar">
          @if (isMobile()) {
            <button mat-icon-button type="button" (click)="nav.toggle()" aria-label="Toggle navigation"><mat-icon>menu</mat-icon></button>
          }
          <span class="spacer"></span>
          <span class="badge info">Mock data · changes saved in this browser</span>
          <span class="who"><mat-icon>admin_panel_settings</mat-icon>{{ users.user()?.firstName }} {{ users.user()?.lastName }}</span>
        </mat-toolbar>
        @if (loading.isLoading()) {
          <mat-progress-bar mode="indeterminate" class="progress" />
        }
        <main class="content"><router-outlet /></main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    .shell { min-height: 100vh; background: #f5f6fa; }
    .sidenav { width: 248px; background: var(--ss-ink); color: #c7cbe0; border: 0; padding: 20px 12px; display: flex; flex-direction: column; }
    ::ng-deep .sidenav .mat-drawer-inner-container { display: flex; flex-direction: column; }
    .brand { font-family: var(--ss-font-display); font-weight: 800; font-size: 1.4rem; color: #fff; text-decoration: none; padding: 0 12px 20px; display: flex; align-items: baseline; gap: 2px; }
    .brand span { color: var(--ss-coral); } .brand small { font-size: 11px; margin-left: 8px; padding: 2px 8px; border-radius: 99px; background: rgba(255,255,255,0.12); color: #fff; font-family: var(--ss-font-body); }
    nav, .side-footer { display: grid; gap: 2px; }
    .side-footer { margin-top: auto; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px; }
    nav a, .side-footer a, .side-footer button { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 10px; color: #c7cbe0; text-decoration: none; font: inherit; border: 0; background: none; cursor: pointer; text-align: left; }
    nav a:hover, .side-footer a:hover, .side-footer button:hover { background: rgba(255,255,255,0.08); color: #fff; }
    nav a.active { background: var(--ss-coral); color: #fff; font-weight: 600; }
    .toolbar { background: #fff; border-bottom: 1px solid var(--ss-line); gap: 12px; position: sticky; top: 0; z-index: 10; }
    .spacer { flex: 1; } .who { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; }
    .progress { position: sticky; top: 64px; z-index: 10; }
    .content { padding: 28px; max-width: 1400px; }
    @media (max-width: 599px) { .content { padding: 16px; } .toolbar .badge { display: none; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {
  readonly users = inject(UserService);
  readonly loading = inject(LoadingService);
  readonly isMobile = toSignal(inject(BreakpointObserver).observe('(max-width: 959px)').pipe(map((r) => r.matches)), {
    initialValue: false,
  });

  readonly links = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/admin/products', label: 'Products', icon: 'inventory_2' },
    { path: '/admin/categories', label: 'Categories', icon: 'category' },
    { path: '/admin/orders', label: 'Orders', icon: 'receipt_long' },
    { path: '/admin/inventory', label: 'Inventory', icon: 'warehouse' },
  ];
}
