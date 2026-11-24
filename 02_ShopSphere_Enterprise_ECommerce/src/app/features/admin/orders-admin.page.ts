import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { catchError, of } from 'rxjs';
import { ORDER_STATUS_FLOW, Order, OrderStatus } from '@core/models';
import { NotificationService } from '@core/services/notification.service';
import { OrderService } from '@core/services/order.service';
import { OrderStatusBadgeComponent } from '@shared/components/order-status-badge/order-status-badge.component';
import { ORDER_STATUS_META } from '@shared/pipes/order-status.pipe';

@Component({
  selector: 'app-orders-admin-page',
  imports: [CurrencyPipe, DatePipe, UpperCasePipe, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatPaginatorModule, OrderStatusBadgeComponent],
  template: `
    <header class="admin-head">
      <div>
        <h1>Orders</h1>
        <p>{{ filtered().length }} of {{ orders().length }} orders · update fulfilment status.</p>
      </div>
    </header>

    <div class="filters-bar">
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Search order #, customer or email</mat-label>
        <input matInput (input)="search.set($any($event.target).value); pageIndex.set(0)" />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Status</mat-label>
        <mat-select [value]="status()" (selectionChange)="status.set($event.value); pageIndex.set(0)">
          <mat-option value="all">All statuses</mat-option>
          @for (s of statuses; track s) {
            <mat-option [value]="s">{{ meta[s].label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    <div class="panel table-wrap">
      <table class="simple-table">
        <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th>Update status</th></tr></thead>
        <tbody>
          @for (o of page(); track o.id) {
            <tr>
              <td><strong>{{ o.number }}</strong><br /><small class="muted">{{ o.items.length }} items</small></td>
              <td>{{ o.customer.firstName }} {{ o.customer.lastName }}<br /><small class="muted">{{ o.customer.email }}</small></td>
              <td>{{ o.createdAt | date: 'MMM d, y' }}</td>
              <td>{{ o.total | currency: 'USD' }}</td>
              <td>{{ o.payment.method | uppercase }}</td>
              <td><app-order-status-badge [status]="o.status" /></td>
              <td>
                @if (nextStatuses(o).length) {
                  <mat-form-field subscriptSizing="dynamic" class="status-select">
                    <mat-select placeholder="Move to…" (selectionChange)="setStatus(o, $event.value)" [attr.aria-label]="'Update status of ' + o.number">
                      @for (s of nextStatuses(o); track s) {
                        <mat-option [value]="s">{{ meta[s].label }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                } @else {
                  <span class="muted">Final</span>
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="muted">No orders match the filters.</td></tr>
          }
        </tbody>
      </table>
      <mat-paginator [length]="filtered().length" [pageIndex]="pageIndex()" [pageSize]="pageSize()" [pageSizeOptions]="[10, 20, 50]" (page)="onPage($event)" showFirstLastButtons />
    </div>
  `,
  styleUrl: './admin.scss',
  styles: `.status-select { width: 170px; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersAdminPage {
  private readonly orderService = inject(OrderService);
  private readonly notify = inject(NotificationService);

  readonly meta = ORDER_STATUS_META;
  readonly statuses: OrderStatus[] = [...ORDER_STATUS_FLOW, 'cancelled'];
  readonly orders = toSignal(this.orderService.orders$.pipe(catchError(() => of([] as Order[]))), { initialValue: [] as Order[] });
  readonly search = signal('');
  readonly status = signal<OrderStatus | 'all'>('all');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly filtered = computed(() => {
    const t = this.search().trim().toLowerCase();
    const s = this.status();
    return this.orders().filter(
      (o) =>
        (s === 'all' || o.status === s) &&
        (!t ||
          o.number.toLowerCase().includes(t) ||
          `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().includes(t) ||
          o.customer.email.toLowerCase().includes(t)),
    );
  });

  readonly page = computed(() => this.filtered().slice(this.pageIndex() * this.pageSize(), (this.pageIndex() + 1) * this.pageSize()));

  /** Allowed transitions: forward along the fulfilment flow, or cancel before shipping. */
  nextStatuses(o: Order): OrderStatus[] {
    if (o.status === 'delivered' || o.status === 'cancelled') return [];
    const idx = ORDER_STATUS_FLOW.indexOf(o.status);
    const forward = ORDER_STATUS_FLOW.slice(idx + 1);
    return this.orderService.canCancel(o) ? [...forward, 'cancelled'] : forward;
  }

  setStatus(o: Order, status: OrderStatus): void {
    this.orderService.updateStatus(o, status).subscribe(() => this.notify.success(`${o.number} → ${ORDER_STATUS_META[status].label}`));
  }

  onPage(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
  }
}
