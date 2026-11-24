import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, catchError, combineLatest, defer, delay, map, of, shareReplay, take, throwError, switchMap } from 'rxjs';
import { CartItem, CartTotals, CheckoutPayload, DELIVERY_OPTIONS, Order, OrderStatus } from '../models';
import { SILENT_ERRORS, apiUrl, uid } from './api';
import { ProductService } from './product.service';
import { StorageService } from './storage.service';

interface LocalOrderData {
  placed: Order[];
  /** Status changes made by admins/customers to seeded orders. */
  patches: Record<string, Pick<Order, 'status' | 'timeline'>>;
}

const STORAGE_KEY = 'orders';
const EMPTY: LocalOrderData = { placed: [], patches: {} };

const STATUS_NOTES: Record<OrderStatus, string> = {
  pending: 'Order placed',
  processing: 'Order confirmed and being packed',
  shipped: 'Handed to carrier',
  'out-for-delivery': 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Order cancelled',
};

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly productService = inject(ProductService);
  private readonly local = signal<LocalOrderData>(this.storage.get(STORAGE_KEY, EMPTY));
  private seed$?: Observable<Order[]>;

  /** All orders, newest first (seeded history + orders placed in this browser). */
  readonly orders$: Observable<Order[]> = combineLatest([defer(() => this.loadSeed()), toObservable(this.local)]).pipe(
    map(([seed, local]) =>
      [...local.placed, ...seed.map((o) => (local.patches[o.id] ? { ...o, ...local.patches[o.id] } : o))].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  getForUser(userId: string): Observable<Order[]> {
    return this.orders$.pipe(map((orders) => orders.filter((o) => o.userId === userId)));
  }

  getById(id: string): Observable<Order | undefined> {
    return this.orders$.pipe(map((orders) => orders.find((o) => o.id === id || o.number === id)));
  }

  /**
   * Creates an order from the cart. Payment is SIMULATED – nothing is charged and no card data
   * is stored except the last four digits for display.
   */
  placeOrder(payload: CheckoutPayload, items: CartItem[], totals: CartTotals, userId: string | null, couponCode: string | null): Observable<Order> {
    if (!items.length) return throwError(() => new Error('Your cart is empty.'));
    return this.productService.getByIds(items.map((i) => i.productId)).pipe(
      take(1),
      switchMap((products) => {
        const unavailable = items.find((i) => {
          const p = products.find((x) => x.id === i.productId);
          return !p || p.stock < i.quantity;
        });
        if (unavailable) {
          return throwError(() => new Error(`Sorry, "${unavailable.name}" no longer has enough stock. Please update your cart.`));
        }
        const delivery = DELIVERY_OPTIONS.find((d) => d.id === payload.deliveryOptionId) ?? DELIVERY_OPTIONS[0];
        const now = new Date();
        const eta = new Date(now.getTime() + (delivery.etaDays + 1) * 24 * 3600_000);
        const order: Order = {
          id: uid('o'),
          number: `SS-${now.getFullYear().toString().slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
          userId: userId ?? 'guest',
          customer: payload.customer,
          shippingAddress: payload.shippingAddress,
          items: items.map((i) => ({ productId: i.productId, name: i.name, image: i.image, price: i.price, quantity: i.quantity })),
          subtotal: totals.subtotal,
          discount: totals.couponDiscount,
          shipping: totals.shipping,
          tax: totals.tax,
          total: totals.total,
          couponCode,
          delivery: { id: delivery.id, label: delivery.label, price: totals.shipping, etaDays: delivery.etaDays },
          payment: {
            method: payload.paymentMethod,
            label: 'Demo payment – no real charge was made',
            cardLast4: payload.cardLast4,
          },
          status: 'pending',
          createdAt: now.toISOString(),
          estimatedDelivery: eta.toISOString().slice(0, 10),
          timeline: [{ status: 'pending', date: now.toISOString(), note: 'Order placed (demo checkout)' }],
        };
        this.patch((l) => ({ ...l, placed: [order, ...l.placed] }));
        this.productService.reduceStock(items);
        return of(order).pipe(delay(900)); // simulate payment processing time
      }),
    );
  }

  updateStatus(order: Order, status: OrderStatus, note?: string): Observable<Order> {
    const timeline = [...order.timeline, { status, date: new Date().toISOString(), note: note ?? STATUS_NOTES[status] }];
    const updated: Order = { ...order, status, timeline };
    this.patch((l) =>
      l.placed.some((o) => o.id === order.id)
        ? { ...l, placed: l.placed.map((o) => (o.id === order.id ? updated : o)) }
        : { ...l, patches: { ...l.patches, [order.id]: { status, timeline } } },
    );
    return of(updated).pipe(delay(250));
  }

  canCancel(order: Order): boolean {
    return order.status === 'pending' || order.status === 'processing';
  }

  cancel(order: Order): Observable<Order> {
    if (!this.canCancel(order)) {
      return throwError(() => new Error('This order has already shipped and can no longer be cancelled.'));
    }
    return this.updateStatus(order, 'cancelled', 'Cancelled by customer');
  }

  resetLocalOrders(): void {
    this.patch(() => EMPTY);
  }

  private patch(fn: (l: LocalOrderData) => LocalOrderData): void {
    this.local.update(fn);
    this.storage.set(STORAGE_KEY, this.local());
  }

  private loadSeed(): Observable<Order[]> {
    if (!this.seed$) {
      this.seed$ = this.http.get<Order[]>(apiUrl('orders'), { context: new HttpContext().set(SILENT_ERRORS, true) }).pipe(
        catchError((err) => {
          this.seed$ = undefined;
          return throwError(() => err);
        }),
        shareReplay(1),
      );
    }
    return this.seed$;
  }
}
