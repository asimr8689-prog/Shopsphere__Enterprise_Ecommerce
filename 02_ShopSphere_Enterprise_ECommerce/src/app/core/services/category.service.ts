import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, catchError, combineLatest, defer, delay, map, of, shareReplay, throwError } from 'rxjs';
import { Category } from '../models';
import { SILENT_ERRORS, apiUrl } from './api';
import { slugify } from './product.service';
import { StorageService } from './storage.service';

interface CategoryOverrides {
  created: Category[];
  updated: Record<string, Category>;
  deleted: string[];
}

const STORAGE_KEY = 'admin-category-overrides';
const EMPTY: CategoryOverrides = { created: [], updated: {}, deleted: [] };

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly overrides = signal<CategoryOverrides>(this.storage.get(STORAGE_KEY, EMPTY));
  private base$?: Observable<Category[]>;

  readonly categories$: Observable<Category[]> = combineLatest([
    defer(() => this.loadBase()),
    toObservable(this.overrides),
  ]).pipe(
    map(([base, o]) =>
      [...base.map((c) => o.updated[c.id] ?? c), ...o.created].filter((c) => !o.deleted.includes(c.id)),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Lookup map id → category, convenient for templates. */
  readonly categoryMap$: Observable<Record<string, Category>> = this.categories$.pipe(
    map((list) => Object.fromEntries(list.map((c) => [c.id, c]))),
  );

  getBySlug(slug: string): Observable<Category | undefined> {
    return this.categories$.pipe(map((list) => list.find((c) => c.slug === slug)));
  }

  create(data: Pick<Category, 'name' | 'description' | 'icon'>): Observable<Category> {
    const id = slugify(data.name);
    const category: Category = { ...data, id, slug: id, image: 'images/categories/home.svg' };
    this.patch((o) => ({ ...o, created: [...o.created, category], deleted: o.deleted.filter((d) => d !== id) }));
    return of(category).pipe(delay(200));
  }

  update(category: Category): Observable<Category> {
    this.patch((o) =>
      o.created.some((c) => c.id === category.id)
        ? { ...o, created: o.created.map((c) => (c.id === category.id ? category : c)) }
        : { ...o, updated: { ...o.updated, [category.id]: category } },
    );
    return of(category).pipe(delay(200));
  }

  delete(id: string): Observable<void> {
    this.patch((o) =>
      o.created.some((c) => c.id === id)
        ? { ...o, created: o.created.filter((c) => c.id !== id) }
        : { ...o, deleted: [...new Set([...o.deleted, id])] },
    );
    return of(undefined).pipe(delay(200));
  }

  resetAdminChanges(): void {
    this.patch(() => EMPTY);
  }

  private patch(fn: (o: CategoryOverrides) => CategoryOverrides): void {
    this.overrides.update(fn);
    this.storage.set(STORAGE_KEY, this.overrides());
  }

  private loadBase(): Observable<Category[]> {
    if (!this.base$) {
      this.base$ = this.http
        .get<Category[]>(apiUrl('categories'), { context: new HttpContext().set(SILENT_ERRORS, true) })
        .pipe(
          catchError((err) => {
            this.base$ = undefined;
            return throwError(() => err);
          }),
          shareReplay(1),
        );
    }
    return this.base$;
  }
}
