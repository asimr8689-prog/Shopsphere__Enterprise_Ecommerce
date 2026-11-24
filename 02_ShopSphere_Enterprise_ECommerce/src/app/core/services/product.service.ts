import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, combineLatest, defer, delay, map, of, shareReplay, take, throwError, catchError } from 'rxjs';
import { PagedResult, Product, ProductQuery, ProductTag, discountPercent } from '../models';
import { SILENT_ERRORS, apiUrl, uid } from './api';
import { applyProductQuery, searchScore } from './product-query';
import { StorageService } from './storage.service';

interface ProductOverrides {
  created: Product[];
  updated: Record<string, Product>;
  deleted: string[];
}

const STORAGE_KEY = 'admin-product-overrides';
const EMPTY_OVERRIDES: ProductOverrides = { created: [], updated: {}, deleted: [] };

export type ProductDraft = Omit<Product, 'id' | 'slug' | 'reviews' | 'createdAt' | 'sold' | 'rating' | 'reviewCount'> &
  Partial<Pick<Product, 'rating' | 'reviewCount' | 'sold'>>;

/**
 * Product catalogue API.
 * Seed data comes from /data/products.json via HttpClient; admin edits are layered on top
 * and persisted to localStorage (a real backend would own this – see FEATURES.md).
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);

  private readonly overrides = signal<ProductOverrides>(this.storage.get(STORAGE_KEY, EMPTY_OVERRIDES));
  private base$?: Observable<Product[]>;
  private latest: Product[] = [];

  /** Full catalogue (seed + admin changes). Re-emits whenever an admin edits products. */
  readonly products$: Observable<Product[]> = combineLatest([
    defer(() => this.loadBase()),
    toObservable(this.overrides),
  ]).pipe(
    map(([base, o]) => {
      const merged = [...base.map((p) => o.updated[p.id] ?? p), ...o.created].filter((p) => !o.deleted.includes(p.id));
      this.latest = merged;
      return merged;
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly brands$: Observable<string[]> = this.products$.pipe(
    map((list) => [...new Set(list.map((p) => p.brand))].sort()),
  );

  readonly priceBounds$: Observable<{ min: number; max: number }> = this.products$.pipe(
    map((list) => ({
      min: Math.floor(Math.min(...list.map((p) => p.price), 0)),
      max: Math.ceil(Math.max(...list.map((p) => p.price), 0)),
    })),
  );

  query(query: ProductQuery): Observable<PagedResult<Product>> {
    return this.products$.pipe(map((all) => applyProductQuery(all, query)));
  }

  getBySlug(slug: string): Observable<Product | undefined> {
    return this.products$.pipe(map((all) => all.find((p) => p.slug === slug || p.id === slug)));
  }

  getById(id: string): Observable<Product | undefined> {
    return this.products$.pipe(map((all) => all.find((p) => p.id === id)));
  }

  getByIds(ids: string[]): Observable<Product[]> {
    return this.products$.pipe(
      map((all) => ids.map((id) => all.find((p) => p.id === id)).filter((p): p is Product => !!p)),
    );
  }

  getByTag(tag: ProductTag, limit = 8): Observable<Product[]> {
    return this.products$.pipe(map((all) => all.filter((p) => p.tags.includes(tag)).slice(0, limit)));
  }

  getBestSellers(limit = 8): Observable<Product[]> {
    return this.products$.pipe(map((all) => [...all].sort((a, b) => b.sold - a.sold).slice(0, limit)));
  }

  getSpecialOffers(limit = 4): Observable<Product[]> {
    return this.products$.pipe(
      map((all) =>
        all
          .filter((p) => discountPercent(p) > 0 && p.stock > 0)
          .sort((a, b) => discountPercent(b) - discountPercent(a))
          .slice(0, limit),
      ),
    );
  }

  getRelated(product: Product, limit = 4): Observable<Product[]> {
    return this.products$.pipe(
      map((all) => {
        const others = all.filter((p) => p.id !== product.id);
        const sameCategory = others.filter((p) => p.categoryId === product.categoryId);
        const sameBrand = others.filter((p) => p.brand === product.brand && p.categoryId !== product.categoryId);
        return [...sameCategory, ...sameBrand].slice(0, limit);
      }),
    );
  }

  /** Lightweight suggestions for the header search box. */
  search(term: string, limit = 6): Observable<Product[]> {
    if (!term.trim()) return of([]);
    return this.products$.pipe(
      take(1),
      map((all) =>
        all
          .map((p) => ({ p, s: searchScore(p, term) }))
          .filter((x) => x.s > 0)
          .sort((a, b) => b.s - a.s)
          .slice(0, limit)
          .map((x) => x.p),
      ),
    );
  }

  // ---------------- Admin operations (local persistence) ----------------

  create(draft: ProductDraft): Observable<Product> {
    const slugBase = slugify(draft.name);
    const slug = this.latest.some((p) => p.slug === slugBase) ? `${slugBase}-${Date.now().toString(36)}` : slugBase;
    const product: Product = {
      ...draft,
      id: uid('p'),
      slug,
      rating: draft.rating ?? 0,
      reviewCount: draft.reviewCount ?? 0,
      sold: draft.sold ?? 0,
      reviews: [],
      createdAt: new Date().toISOString(),
    };
    this.patchOverrides((o) => ({ ...o, created: [...o.created, product] }));
    return of(product).pipe(delay(250));
  }

  update(product: Product): Observable<Product> {
    if (!this.latest.some((p) => p.id === product.id)) {
      return throwError(() => new Error('Product no longer exists.'));
    }
    this.patchOverrides((o) => {
      const isCreated = o.created.some((p) => p.id === product.id);
      return isCreated
        ? { ...o, created: o.created.map((p) => (p.id === product.id ? product : p)) }
        : { ...o, updated: { ...o.updated, [product.id]: product } };
    });
    return of(product).pipe(delay(200));
  }

  delete(id: string): Observable<void> {
    this.patchOverrides((o) =>
      o.created.some((p) => p.id === id)
        ? { ...o, created: o.created.filter((p) => p.id !== id) }
        : { ...o, deleted: [...new Set([...o.deleted, id])] },
    );
    return of(undefined).pipe(delay(200));
  }

  /** Decrements stock after an order is placed (keeps inventory screens consistent). */
  reduceStock(lines: { productId: string; quantity: number }[]): void {
    for (const line of lines) {
      const p = this.latest.find((x) => x.id === line.productId);
      if (p) {
        this.update({ ...p, stock: Math.max(0, p.stock - line.quantity), sold: p.sold + line.quantity }).subscribe();
      }
    }
  }

  resetAdminChanges(): void {
    this.patchOverrides(() => EMPTY_OVERRIDES);
  }

  private patchOverrides(fn: (o: ProductOverrides) => ProductOverrides): void {
    this.overrides.update(fn);
    this.storage.set(STORAGE_KEY, this.overrides());
  }

  private loadBase(): Observable<Product[]> {
    if (!this.base$) {
      this.base$ = this.http
        .get<Product[]>(apiUrl('products'), { context: new HttpContext().set(SILENT_ERRORS, true) })
        .pipe(
          catchError((err) => {
            this.base$ = undefined; // allow a retry to re-request
            return throwError(() => err);
          }),
          shareReplay(1),
        );
    }
    return this.base$;
  }
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
