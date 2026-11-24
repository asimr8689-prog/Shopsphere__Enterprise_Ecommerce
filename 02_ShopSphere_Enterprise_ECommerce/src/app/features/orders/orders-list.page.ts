import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Order } from '@core/models';
import { OrderService } from '@core/services/order.service';
import { UserService } from '@core/services/user.service';
import { loadableSignal } from '@core/utils/loadable';
import { OrderStatusBadgeComponent } from '@shared/components/order-status-badge/order-status-badge.component';
import { EmptyStateComponent, ErrorStateComponent } from '@shared/components/state/state.components';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';

type OrderFilter = 'all' | 'active' | 'delivered' | 'cancelled';

@Component({
  selector: 'app-orders-list-page',
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    OrderStatusBadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ImgFallbackDirective,
  ],
  template: `
    <h1 class="page-title">My orders</h1>
    <p class="page-subtitle">Track, review and manage your purchases.</p>

    <div class="toolbar">
      <mat-button-toggle-group [value]="filter()" (change)="filter.set($event.value)" aria-label="Filter orders">
        <mat-button-toggle value="all">All ({{ counts().all }})</mat-button-toggle>
        <mat-button-toggle value="active">Active ({{ counts().active }})</mat-button-toggle>
        <mat-button-toggle value="delivered">Delivered ({{ counts().delivered }})</mat-button-toggle>
        <mat-button-toggle value="cancelled">Cancelled ({{ counts().cancelled }})</mat-button-toggle>
      </mat-button-toggle-group>
      <mat-form-field subscriptSizing="dynamic" class="search">
        <mat-label>Search order # or product</mat-label>
        <input matInput [value]="search()" (input)="search.set($any($event.target).value)" />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
    </div>

    @switch (orders.state().status) {
      @case ('loading') {
        <p class="muted">Loading orders…</p>
      }
      @case ('error') {
        <app-error-state [message]="orders.state().error ?? ''" (retry)="orders.retry()" />
      }
      @default {
        <ul class="list">
          @for (o of visible(); track o.id) {
            <li class="order">
              <div class="top">
                <div><span class="muted">Order</span><strong>{{ o.number }}</strong></div>
                <div><span class="muted">Placed</span><strong>{{ o.createdAt | date: 'mediumDate' }}</strong></div>
                <div><span class="muted">Total</span><strong>{{ o.total | currency: 'USD' }}</strong></div>
                <app-order-status-badge [status]="o.status" />
              </div>
              <div class="bottom">
                <div class="thumbs">
                  @for (i of o.items.slice(0, 4); track i.productId) {
                    <img [src]="i.image" [alt]="i.name" appImgFallback width="56" height="56" />
                  }
                  <span class="muted">{{ o.items.length }} {{ o.items.length === 1 ? 'item' : 'items' }}</span>
                </div>
                <a mat-stroked-button [routerLink]="['/account/orders', o.id]">
                  {{ o.status === 'delivered' || o.status === 'cancelled' ? 'View details' : 'Track order' }}
                </a>
              </div>
            </li>
          } @empty {
            <app-empty-state icon="receipt_long" title="No orders here" message="Orders you place will appear here.">
              <a mat-flat-button routerLink="/products">Start shopping</a>
            </app-empty-state>
          }
        </ul>
      }
    }
  `,
  styles: `
    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
    .search { width: 280px; }
    .list { list-style: none; padding: 0; margin: 0; display: grid; gap: 16px; }
    .order { background: var(--ss-surface); border: 1px solid var(--ss-line); border-radius: var(--ss-radius-lg); overflow: hidden; }
    .top { display: flex; gap: 28px; align-items: center; flex-wrap: wrap; padding: 14px 18px; background: var(--ss-surface-2); }
    .top div { display: flex; flex-direction: column; font-size: 13px; } .top strong { font-size: 14px; color: var(--ss-ink); }
    .top app-order-status-badge { margin-left: auto; }
    .bottom { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; gap: 12px; flex-wrap: wrap; }
    .thumbs { display: flex; align-items: center; gap: 8px; } .thumbs img { width: 56px; height: 56px; border-radius: 10px; }
    @media (max-width: 599px) { mat-button-toggle-group { overflow-x: auto; max-width: 100%; } .search { width: 100%; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersListPage {
  private readonly orderService = inject(OrderService);
  private readonly users = inject(UserService);

  readonly filter = signal<OrderFilter>('all');
  readonly search = signal('');
  readonly orders = loadableSignal(() => this.orderService.getForUser(this.users.user()?.id ?? ''));

  private readonly all = computed<Order[]>(() => this.orders.state().data ?? []);

  readonly counts = computed(() => {
    const list = this.all();
    return {
      all: list.length,
      active: list.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length,
      delivered: list.filter((o) => o.status === 'delivered').length,
      cancelled: list.filter((o) => o.status === 'cancelled').length,
    };
  });

  readonly visible = computed(() => {
    const f = this.filter();
    const term = this.search().trim().toLowerCase();
    return this.all().filter((o) => {
      const statusOk =
        f === 'all' ||
        (f === 'active' && !['delivered', 'cancelled'].includes(o.status)) ||
        (f === 'delivered' && o.status === 'delivered') ||
        (f === 'cancelled' && o.status === 'cancelled');
      const searchOk = !term || o.number.toLowerCase().includes(term) || o.items.some((i) => i.name.toLowerCase().includes(term));
      return statusOk && searchOk;
    });
  });
}
