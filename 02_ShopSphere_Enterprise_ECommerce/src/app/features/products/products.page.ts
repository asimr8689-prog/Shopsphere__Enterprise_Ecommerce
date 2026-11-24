import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, catchError, combineLatest, map, of, startWith, switchMap } from 'rxjs';
import { ProductQuery, SortOption } from '@core/models';
import { CategoryService } from '@core/services/category.service';
import { ProductService } from '@core/services/product.service';
import { DEFAULT_QUERY } from '@core/services/product-query';
import { LOADING, Loadable, toLoadable } from '@core/utils/loadable';
import { PagedResult, Product } from '@core/models';
import { ProductCardComponent } from '@shared/components/product-card/product-card.component';
import {
  EmptyStateComponent,
  ErrorStateComponent,
  ProductCardSkeletonComponent,
} from '@shared/components/state/state.components';
import { ProductFiltersComponent } from './product-filters.component';
import { PAGE_SIZE_OPTIONS, parseProductQuery, toQueryParams } from './product-query-params';

@Component({
  selector: 'app-products-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatChipsModule,
    ProductCardComponent,
    ProductCardSkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ProductFiltersComponent,
  ],
  templateUrl: './products.page.html',
  styleUrl: './products.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);

  readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'relevance', label: 'Recommended' },
    { value: 'popularity', label: 'Most popular' },
    { value: 'price-asc', label: 'Price: low to high' },
    { value: 'price-desc', label: 'Price: high to low' },
    { value: 'rating', label: 'Top rated' },
    { value: 'newest', label: 'Newest' },
  ];
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly filtersOpen = signal(false);

  /** URL query params → typed query (signal). */
  readonly query = toSignal(this.route.queryParamMap.pipe(map(parseProductQuery)), { initialValue: DEFAULT_QUERY });

  readonly categories = toSignal(inject(CategoryService).categories$.pipe(catchError(() => of([]))), { initialValue: [] });
  readonly brands = toSignal(this.productService.brands$.pipe(catchError(() => of([]))), { initialValue: [] });
  readonly priceBounds = toSignal(this.productService.priceBounds$.pipe(catchError(() => of({ min: 0, max: 0 }))), {
    initialValue: { min: 0, max: 0 },
  });

  private readonly retry$ = new Subject<void>();

  /** Re-runs the search whenever the query changes or the user hits "retry". */
  readonly result = toSignal(
    combineLatest([toObservable(this.query), this.retry$.pipe(startWith(undefined))]).pipe(
      switchMap(([q]) => toLoadable(this.productService.query(q))),
    ),
    { initialValue: LOADING as Loadable<PagedResult<Product>> },
  );

  readonly categoryNames = computed(() => Object.fromEntries(this.categories().map((c) => [c.id, c.name])));

  readonly heading = computed(() => {
    const q = this.query();
    if (q.search) return `Results for “${q.search}”`;
    if (q.categories.length === 1) return this.categoryNames()[q.categories[0]] ?? 'Products';
    if (q.onSaleOnly) return 'Deals & special offers';
    return 'All products';
  });

  /** Chips describing active filters, each removable. */
  readonly activeFilters = computed(() => {
    const q = this.query();
    const chips: { label: string; patch: Partial<ProductQuery> }[] = [];
    if (q.search) chips.push({ label: `“${q.search}”`, patch: { search: '' } });
    q.categories.forEach((c) =>
      chips.push({ label: this.categoryNames()[c] ?? c, patch: { categories: q.categories.filter((x) => x !== c) } }),
    );
    q.brands.forEach((b) => chips.push({ label: b, patch: { brands: q.brands.filter((x) => x !== b) } }));
    if (q.minPrice != null || q.maxPrice != null) {
      chips.push({ label: `$${q.minPrice ?? 0} – ${q.maxPrice != null ? '$' + q.maxPrice : 'any'}`, patch: { minPrice: null, maxPrice: null } });
    }
    if (q.minRating != null) chips.push({ label: `${q.minRating}★ & up`, patch: { minRating: null } });
    if (q.inStockOnly) chips.push({ label: 'In stock', patch: { inStockOnly: false } });
    if (q.onSaleOnly) chips.push({ label: 'On sale', patch: { onSaleOnly: false } });
    return chips;
  });

  update(patch: Partial<ProductQuery>, resetPage = true): void {
    const next: ProductQuery = { ...this.query(), ...patch, ...(resetPage && !('page' in patch) ? { page: 1 } : {}) };
    this.router.navigate([], { relativeTo: this.route, queryParams: toQueryParams(next) });
  }

  clearFilters(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { sort: this.query().sort !== 'relevance' ? this.query().sort : null } });
  }

  onPage(event: PageEvent): void {
    const sizeChanged = event.pageSize !== this.query().pageSize;
    this.update({ page: sizeChanged ? 1 : event.pageIndex + 1, pageSize: event.pageSize });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retry(): void {
    this.retry$.next();
  }
}
