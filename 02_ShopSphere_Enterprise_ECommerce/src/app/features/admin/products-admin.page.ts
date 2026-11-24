import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { combineLatest, filter, switchMap } from 'rxjs';
import { Category, Product, stockStatus } from '@core/models';
import { errorMessage } from '@core/services/api';
import { CategoryService } from '@core/services/category.service';
import { NotificationService } from '@core/services/notification.service';
import { ProductService } from '@core/services/product.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { RatingStarsComponent } from '@shared/components/rating-stars/rating-stars.component';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';
import { ProductFormData, ProductFormDialogComponent } from './product-form-dialog.component';

@Component({
  selector: 'app-products-admin-page',
  imports: [
    RouterLink,
    CurrencyPipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    RatingStarsComponent,
    ImgFallbackDirective,
  ],
  template: `
    <header class="admin-head">
      <div>
        <h1>Products</h1>
        <p>{{ dataSource.data.length }} products · create, edit and delete catalogue items.</p>
      </div>
      <button mat-flat-button type="button" (click)="openForm(null)"><mat-icon>add</mat-icon> Add product</button>
    </header>

    <div class="filters-bar">
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Search</mat-label>
        <input matInput (input)="search.set($any($event.target).value); applyFilter()" placeholder="Name or brand" />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Category</mat-label>
        <mat-select [value]="category()" (selectionChange)="category.set($event.value); applyFilter()">
          <mat-option value="">All categories</mat-option>
          @for (c of categories(); track c.id) {
            <mat-option [value]="c.id">{{ c.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      @if (error()) {
        <span class="badge danger">{{ error() }}</span>
      }
    </div>

    <div class="mat-table-card table-wrap">
      <table mat-table [dataSource]="dataSource" matSort matSortActive="name" matSortDirection="asc">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Product</th>
          <td mat-cell *matCellDef="let p">
            <div class="cell-product">
              <img [src]="p.images[0]" alt="" appImgFallback width="40" height="40" />
              <div><a [routerLink]="['/products', p.slug]">{{ p.name }}</a><small>{{ p.brand }} · {{ p.id }}</small></div>
            </div>
          </td>
        </ng-container>
        <ng-container matColumnDef="categoryId">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
          <td mat-cell *matCellDef="let p">{{ categoryName(p.categoryId) }}</td>
        </ng-container>
        <ng-container matColumnDef="price">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Price</th>
          <td mat-cell *matCellDef="let p">
            {{ p.price | currency: 'USD' }}
            @if (p.compareAtPrice) { <small class="muted"><s>{{ p.compareAtPrice | currency: 'USD' }}</s></small> }
          </td>
        </ng-container>
        <ng-container matColumnDef="stock">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Stock</th>
          <td mat-cell *matCellDef="let p">
            <span class="badge" [class.success]="stock(p) === 'in-stock'" [class.warning]="stock(p) === 'low-stock'" [class.danger]="stock(p) === 'out-of-stock'">{{ p.stock }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="rating">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Rating</th>
          <td mat-cell *matCellDef="let p"><app-rating-stars [rating]="p.rating" [showValue]="true" /></td>
        </ng-container>
        <ng-container matColumnDef="sold">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Sold</th>
          <td mat-cell *matCellDef="let p">{{ p.sold }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef><span class="visually-hidden">Actions</span></th>
          <td mat-cell *matCellDef="let p">
            <button mat-icon-button type="button" (click)="openForm(p)" matTooltip="Edit" [attr.aria-label]="'Edit ' + p.name"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button type="button" class="danger" (click)="remove(p)" matTooltip="Delete" [attr.aria-label]="'Delete ' + p.name"><mat-icon>delete</mat-icon></button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns; sticky: true"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
        <tr class="mat-row" *matNoDataRow><td class="mat-cell no-data" [attr.colspan]="columns.length">No products match the current filters.</td></tr>
      </table>
      <mat-paginator [pageSizeOptions]="[10, 25, 50]" [pageSize]="10" showFirstLastButtons aria-label="Select page" />
    </div>
  `,
  styleUrl: './admin.scss',
  styles: `.no-data { padding: 24px; text-align: center; color: var(--ss-text-muted); } .cell-product a { color: var(--ss-ink); font-weight: 600; text-decoration: none; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsAdminPage implements OnInit, AfterViewInit {
  private readonly products = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly columns = ['name', 'categoryId', 'price', 'stock', 'rating', 'sold', 'actions'];
  readonly dataSource = new MatTableDataSource<Product>([]);
  readonly categories = signal<Category[]>([]);
  readonly search = signal('');
  readonly category = signal('');
  readonly error = signal<string | null>(null);
  private categoryNames: Record<string, string> = {};

  ngOnInit(): void {
    this.dataSource.filterPredicate = (p, raw) => {
      const { term, cat } = JSON.parse(raw) as { term: string; cat: string };
      const t = term.toLowerCase();
      return (!cat || p.categoryId === cat) && (!t || p.name.toLowerCase().includes(t) || p.brand.toLowerCase().includes(t));
    };

    combineLatest([this.products.products$, this.categoryService.categories$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([products, categories]) => {
          this.categories.set(categories);
          this.categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]));
          this.dataSource.data = products;
          this.error.set(null);
          this.cdr.markForCheck(); // MatTableDataSource is not signal-based
        },
        error: (err) => this.error.set(errorMessage(err)),
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  categoryName(id: string): string {
    return this.categoryNames[id] ?? id;
  }

  stock(p: Product) {
    return stockStatus(p.stock);
  }

  applyFilter(): void {
    this.dataSource.filter = JSON.stringify({ term: this.search().trim(), cat: this.category() });
    this.paginator?.firstPage();
  }

  openForm(product: Product | null): void {
    const imageOptions: Record<string, string[]> = {};
    for (const p of this.dataSource.data) {
      (imageOptions[p.categoryId] ??= []).push(p.images[0]);
    }
    const data: ProductFormData = { product, categories: this.categories(), imageOptions };
    this.dialog
      .open(ProductFormDialogComponent, { data, width: '760px', maxWidth: '95vw', autoFocus: 'first-tabbable' })
      .afterClosed()
      .pipe(filter((p): p is Product => !!p))
      .subscribe((p) => this.notify.success(product ? `Saved “${p.name}”` : `Created “${p.name}”`));
  }

  remove(product: Product): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: { title: 'Delete product?', message: `“${product.name}” will be removed from the catalogue.`, confirmLabel: 'Delete', destructive: true },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.products.delete(product.id)),
      )
      .subscribe(() => this.notify.success(`Deleted “${product.name}”`));
  }
}
