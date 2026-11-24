import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, of } from 'rxjs';
import { Product, StockStatus, stockStatus } from '@core/models';
import { NotificationService } from '@core/services/notification.service';
import { ProductService } from '@core/services/product.service';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';

@Component({
  selector: 'app-inventory-page',
  imports: [CurrencyPipe, MatButtonModule, MatIconModule, MatButtonToggleModule, MatTooltipModule, ImgFallbackDirective],
  template: `
    <header class="admin-head">
      <div>
        <h1>Inventory</h1>
        <p>Stock levels and quick restocking. Low stock threshold: 10 units.</p>
      </div>
    </header>

    <section class="kpis">
      <div class="kpi"><mat-icon>inventory</mat-icon><span>Units in stock</span><strong>{{ summary().units }}</strong></div>
      <div class="kpi"><mat-icon>account_balance</mat-icon><span>Inventory value</span><strong>{{ summary().value | currency: 'USD' : 'symbol' : '1.0-0' }}</strong></div>
      <div class="kpi"><mat-icon>warning</mat-icon><span>Low stock</span><strong>{{ summary().low }}</strong></div>
      <div class="kpi"><mat-icon>block</mat-icon><span>Out of stock</span><strong>{{ summary().out }}</strong></div>
    </section>

    <mat-button-toggle-group [value]="view()" (change)="view.set($event.value)" aria-label="Filter by stock status" class="toggle">
      <mat-button-toggle value="all">All</mat-button-toggle>
      <mat-button-toggle value="low-stock">Low stock</mat-button-toggle>
      <mat-button-toggle value="out-of-stock">Out of stock</mat-button-toggle>
    </mat-button-toggle-group>

    <div class="panel table-wrap">
      <table class="simple-table">
        <thead><tr><th>Product</th><th>Status</th><th>Stock</th><th>Value</th><th>Adjust</th></tr></thead>
        <tbody>
          @for (p of visible(); track p.id) {
            <tr>
              <td><div class="prod"><img [src]="p.images[0]" alt="" appImgFallback width="36" height="36" />{{ p.name }}</div></td>
              <td>
                <span class="badge" [class.success]="status(p) === 'in-stock'" [class.warning]="status(p) === 'low-stock'" [class.danger]="status(p) === 'out-of-stock'">
                  {{ status(p) === 'in-stock' ? 'In stock' : status(p) === 'low-stock' ? 'Low' : 'Out' }}
                </span>
              </td>
              <td>
                <input class="stock-input" type="number" min="0" [value]="p.stock" (change)="setStock(p, +$any($event.target).value)" [attr.aria-label]="'Stock for ' + p.name" />
              </td>
              <td>{{ p.price * p.stock | currency: 'USD' : 'symbol' : '1.0-0' }}</td>
              <td class="adjust">
                <button mat-icon-button type="button" (click)="setStock(p, p.stock - 1)" [disabled]="p.stock <= 0" matTooltip="Remove 1" aria-label="Decrease stock"><mat-icon>remove</mat-icon></button>
                <button mat-stroked-button type="button" (click)="setStock(p, p.stock + 10)">+10</button>
                <button mat-stroked-button type="button" (click)="setStock(p, p.stock + 50)">+50</button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="muted">Nothing to show for this filter.</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styleUrl: './admin.scss',
  styles: `
    .toggle { margin-bottom: 12px; }
    .prod { display: flex; align-items: center; gap: 10px; } .prod img { width: 36px; height: 36px; border-radius: 8px; }
    .stock-input { width: 80px; padding: 6px 8px; border: 1px solid var(--ss-line); border-radius: 8px; font: inherit; }
    .adjust { display: flex; gap: 6px; align-items: center; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryPage {
  private readonly products = inject(ProductService);
  private readonly notify = inject(NotificationService);

  readonly all = toSignal(this.products.products$.pipe(catchError(() => of([] as Product[]))), { initialValue: [] as Product[] });
  readonly view = signal<'all' | StockStatus>('all');

  readonly visible = computed(() => {
    const v = this.view();
    const list = [...this.all()].sort((a, b) => a.stock - b.stock);
    return v === 'all' ? list : list.filter((p) => stockStatus(p.stock) === v);
  });

  readonly summary = computed(() => {
    const list = this.all();
    return {
      units: list.reduce((s, p) => s + p.stock, 0),
      value: list.reduce((s, p) => s + p.stock * p.price, 0),
      low: list.filter((p) => stockStatus(p.stock) === 'low-stock').length,
      out: list.filter((p) => p.stock <= 0).length,
    };
  });

  status(p: Product): StockStatus {
    return stockStatus(p.stock);
  }

  setStock(p: Product, value: number): void {
    const stock = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
    if (stock === p.stock) return;
    this.products.update({ ...p, stock }).subscribe(() => this.notify.success(`${p.name}: stock set to ${stock}`));
  }
}
