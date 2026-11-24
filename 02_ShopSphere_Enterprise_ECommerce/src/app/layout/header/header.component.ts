import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { catchError, debounceTime, distinctUntilChanged, filter, map, of, switchMap } from 'rxjs';
import { CartService } from '@core/services/cart.service';
import { CategoryService } from '@core/services/category.service';
import { LoadingService } from '@core/services/loading.service';
import { ProductService } from '@core/services/product.service';
import { UserService } from '@core/services/user.service';
import { WishlistService } from '@core/services/wishlist.service';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    ReactiveFormsModule,
    CurrencyPipe,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatProgressBarModule,
    MatDividerModule,
    ClickOutsideDirective,
    ImgFallbackDirective,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  readonly cart = inject(CartService);
  readonly wishlist = inject(WishlistService);
  readonly users = inject(UserService);
  readonly loading = inject(LoadingService);

  readonly categories = toSignal(inject(CategoryService).categories$.pipe(catchError(() => of([]))), { initialValue: [] });

  readonly search = new FormControl('', { nonNullable: true });
  readonly suggestionsOpen = signal(false);
  readonly mobileMenuOpen = signal(false);

  /** Debounced type-ahead (RxJS): waits for typing to pause, ignores duplicates, cancels stale lookups. */
  readonly suggestions = toSignal(
    this.search.valueChanges.pipe(
      debounceTime(250),
      map((v) => v.trim()),
      distinctUntilChanged(),
      switchMap((term) => (term.length < 2 ? of([]) : this.productService.search(term, 6).pipe(catchError(() => of([]))))),
    ),
    { initialValue: [] },
  );

  constructor() {
    // Close menus whenever navigation completes.
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed()).subscribe(() => {
      this.mobileMenuOpen.set(false);
      this.suggestionsOpen.set(false);
    });
  }

  submitSearch(): void {
    const q = this.search.value.trim();
    this.suggestionsOpen.set(false);
    this.router.navigate(['/products'], { queryParams: q ? { q } : {} });
  }

  clearSearch(): void {
    this.search.setValue('');
    this.suggestionsOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }
}
