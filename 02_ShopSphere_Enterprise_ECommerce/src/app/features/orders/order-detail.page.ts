import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { filter, map, switchMap, take } from 'rxjs';
import { ORDER_STATUS_FLOW, Order, OrderStatus } from '@core/models';
import { errorMessage } from '@core/services/api';
import { CartService } from '@core/services/cart.service';
import { NotificationService } from '@core/services/notification.service';
import { OrderService } from '@core/services/order.service';
import { ProductService } from '@core/services/product.service';
import { UserService } from '@core/services/user.service';
import { loadableSignal } from '@core/utils/loadable';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { OrderStatusBadgeComponent } from '@shared/components/order-status-badge/order-status-badge.component';
import { EmptyStateComponent, ErrorStateComponent } from '@shared/components/state/state.components';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';
import { ORDER_STATUS_META } from '@shared/pipes/order-status.pipe';
import { InvoiceDialogComponent } from './invoice-dialog.component';

@Component({
  selector: 'app-order-detail-page',
  imports: [RouterLink, CurrencyPipe, DatePipe, MatButtonModule, MatIconModule, OrderStatusBadgeComponent, EmptyStateComponent, ErrorStateComponent, ImgFallbackDirective],
  templateUrl: './order-detail.page.html',
  styleUrl: './order-detail.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailPage {
  private readonly orders = inject(OrderService);
  private readonly users = inject(UserService);
  private readonly products = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);

  readonly orderId = input.required<string>();
  private readonly orderId$ = toObservable(this.orderId);

  /** Customers may only see their own orders; admins can see any. */
  readonly resource = loadableSignal(() =>
    this.orderId$.pipe(
      switchMap((id) => this.orders.getById(id)),
      map((o) => (o && (o.userId === this.users.user()?.id || this.users.isAdmin()) ? o : undefined)),
    ),
  );
  readonly state = this.resource.state;
  readonly order = computed(() => this.state().data ?? null);

  /** Tracking steps with completion state for the progress tracker. */
  readonly steps = computed(() => {
    const o = this.order();
    if (!o) return [];
    const reachedIndex = ORDER_STATUS_FLOW.indexOf(o.status);
    return ORDER_STATUS_FLOW.map((status, i) => {
      const entry = o.timeline.find((t) => t.status === status);
      return {
        status,
        label: ORDER_STATUS_META[status].label,
        icon: ORDER_STATUS_META[status].icon,
        done: o.status !== 'cancelled' && i <= reachedIndex,
        current: i === reachedIndex,
        date: entry?.date ?? null,
      };
    });
  });

  readonly timeline = computed(() => [...(this.order()?.timeline ?? [])].reverse());

  canCancel(o: Order): boolean {
    return this.orders.canCancel(o);
  }

  statusLabel(s: OrderStatus): string {
    return ORDER_STATUS_META[s].label;
  }

  openInvoice(o: Order): void {
    this.dialog.open(InvoiceDialogComponent, { data: o, width: '760px', maxWidth: '95vw', autoFocus: false });
  }

  cancel(o: Order): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: `Cancel order ${o.number}?`, message: 'This cannot be undone. Demo orders are never charged.', confirmLabel: 'Cancel order', cancelLabel: 'Keep order', destructive: true },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.orders.cancel(o)),
      )
      .subscribe({
        next: () => this.notify.success(`Order ${o.number} cancelled`),
        error: (err) => this.notify.error(errorMessage(err)),
      });
  }

  /** "Buy again": re-adds available items to the cart at today's prices. */
  buyAgain(o: Order): void {
    this.products
      .getByIds(o.items.map((i) => i.productId))
      .pipe(take(1))
      .subscribe((products) => {
        const available = products.filter((p) => p.stock > 0);
        available.forEach((p) => this.cart.add(p, o.items.find((i) => i.productId === p.id)?.quantity ?? 1));
        if (available.length < o.items.length) this.notify.info('Some items are no longer available and were skipped.');
      });
  }
}
