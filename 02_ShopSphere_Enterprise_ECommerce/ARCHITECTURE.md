# ShopSphere – Architecture

## 1. Application architecture

ShopSphere is a client-side Angular 20 SPA organised in layers. Dependencies point inward only: `features → shared → core`, and `store ↔ core` meet through facades.

```
┌───────────────────────────── features (lazy) ─────────────────────────────┐
│ home · products · product-details · cart · wishlist · checkout · account   │
│ orders · admin · not-found                                                 │
└──────────────┬───────────────────────────────────────────┬────────────────┘
               │ uses                                      │ uses
┌──────────────▼──────────────┐              ┌─────────────▼───────────────┐
│ shared                      │              │ layout                      │
│ components · directives ·   │              │ shell · header · footer     │
│ pipes                       │              └─────────────────────────────┘
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────────────┐
│ core: models · services (API + facades) · guards · interceptors ·        │
│ validators · utils                                                       │
└──────────────┬───────────────────────────────┬──────────────────────────┘
               │ HttpClient                    │ dispatch / selectSignal
┌──────────────▼───────────┐       ┌───────────▼─────────────────────────┐
│ Mock REST API            │       │ NgRx store: cart · wishlist · user   │
│ public/data/*.json       │       │ + hydration meta-reducer (storage)   │
└──────────────────────────┘       └─────────────────────────────────────┘
```

## 2. Component hierarchy

```
App (router-outlet)
├── ShellLayout
│   ├── HeaderComponent ─ search (ClickOutsideDirective), account MatMenu, cart/wishlist badges
│   ├── <router-outlet>
│   │   ├── HomePage ─ SectionHeader, ProductCard*, ProductCardSkeleton, RatingStars, ErrorState
│   │   ├── ProductsPage ─ ProductFiltersComponent (input/output), ProductCard*, MatPaginator, EmptyState
│   │   ├── ProductDetailsPage ─ PriceTag, RatingStars, QuantitySelector (model), MatTabs, ProductCard*
│   │   ├── CartPage ─ QuantitySelector, OrderSummary (content projection), ConfirmDialog
│   │   ├── WishlistPage ─ PriceTag, RatingStars
│   │   ├── CheckoutPage ─ MatStepper(4), OrderSummary, InputMaskDirective
│   │   ├── OrderConfirmationPage
│   │   ├── account/ LoginPage · RegisterPage
│   │   │   └── AccountLayout ─ ProfilePage · AddressesPage · SettingsPage · OrdersListPage · OrderDetailPage (InvoiceDialog)
│   │   └── NotFoundPage
│   └── FooterComponent
└── admin/ AdminLayout (MatSidenav)
    ├── DashboardPage ─ ngx-echarts ×3, OrderStatusBadge
    ├── ProductsAdminPage ─ MatTable/Sort/Paginator, ProductFormDialog (FormArray)
    ├── CategoriesAdminPage
    ├── OrdersAdminPage
    └── InventoryPage
```

`ProductCard` is the most reused component. It talks to `CartService` and `WishlistService` facades directly, so any page can drop it in.

## 3. State management architecture

| Slice | State | Key actions | Effects |
|---|---|---|---|
| `cart` | items, coupon, couponStatus, couponError, deliveryOptionId | Add Item, Remove Item, Update Quantity, Clear Cart, Apply Coupon (+Success/Failure), Remove Coupon, Set Delivery Option | `applyCoupon$` (HTTP), toasts |
| `wishlist` | productIds | Toggle, Add, Remove, Clear, Move To Cart | `moveToCart$` (→ cart add + wishlist remove), toast |
| `user` | session, status, error | Login (+Success/Failure), Register (+…), Logout, Update Profile (+…) | `login$`, `register$`, `authRedirect$`, `logout$`, `updateProfile$`, toasts |

- Selectors are built with `createFeature` + `extraSelectors`. `selectTotals` memoises `calculateCartTotals()`, a pure function that is the single source of truth for pricing.
- **Facades** (`CartService`, `WishlistService`, `UserService`) expose state as Signals (`store.selectSignal`) and turn user intent into actions. Components never import actions directly.
- **Persistence**: `hydrationMetaReducer` restores durable fields on `INIT` (synchronously, so guards see the session on refresh) and writes them back whenever a slice reference changes. Transient fields (status/error) are not persisted. Expired sessions are dropped.
- **Runtime checks** (immutability and serialisability) are enabled.

What deliberately *isn't* in NgRx: catalogue data (cached in services), filter state (URL), and local UI state (component signals).

## 4. Data flow

**Example: applying a coupon**

```
OrderSummary (form submit)
  → CartService.applyCoupon('SAVE10')           facade
  → dispatch CartActions.applyCoupon            store: couponStatus = 'applying'
  → applyCoupon$ effect
       withLatestFrom(selectCartTotals)
       → CartService.validateCoupon(code, subtotal)  → HttpClient GET data/coupons.json
            → interceptors: loading → api(headers, latency) → auth(token) → error(retry, normalise)
  → applyCouponSuccess | applyCouponFailure     store updated
  → selectTotals recomputed (memoised)          → CartService.totals() signal → UI re-renders
  → hydration meta-reducer persists cart        → localStorage
```

**Example: catalogue filtering**

```
URL ?category=audio&sort=price-asc
  → ActivatedRoute.queryParamMap → parseProductQuery() → query signal
  → toObservable(query) + retry$ → ProductService.query(q) → applyProductQuery() (pure)
  → Loadable<PagedResult> signal → template @switch (loading | error | success/empty)
Filter change → ProductFiltersComponent.changed (output) → ProductsPage.update() → router.navigate(queryParams)
```

## 5. Routing structure

| Path | Component | Guard | Loading |
|---|---|---|---|
| `/` | HomePage | – | lazy |
| `/products` | ProductsPage | – | lazy |
| `/products/:slug` | ProductDetailsPage (`slug` → `input()`) | – | lazy |
| `/cart` | CartPage | – | lazy |
| `/wishlist` | WishlistPage | – | lazy |
| `/checkout` | CheckoutPage | `cartNotEmptyGuard` | lazy |
| `/checkout/confirmation/:orderId` | OrderConfirmationPage | – | lazy |
| `/account/login`, `/account/register` | LoginPage, RegisterPage | `guestGuard` | lazy |
| `/account/{profile,orders,orders/:orderId,addresses,settings}` | AccountLayout + children | `authGuard` | lazy (`loadChildren`) |
| `/admin/{dashboard,products,categories,orders,inventory}` | AdminLayout + children | `adminGuard` (**canMatch**, so the bundle isn't downloaded for non-admins) | lazy |
| `**` | NotFoundPage | – | lazy |

Router features: `withComponentInputBinding`, `withViewTransitions`, `withInMemoryScrolling` (scroll to top, anchor scrolling), and route `title`s.

## 6. Service architecture

| Service | Responsibility |
|---|---|
| `ProductService` | Loads `products.json` (cached with `shareReplay`, re-requested after errors), merges admin overrides (signal + localStorage), and provides query/search/related/tags/best-sellers/offers plus admin CRUD and stock reduction |
| `CategoryService` | Categories + admin overrides, id→category map |
| `CartService` | Cart facade (signals) + coupon API |
| `WishlistService` | Wishlist facade + resolved product list |
| `OrderService` | Seeded orders + locally placed orders, place order (stock re-check, simulated payment delay), status updates, cancel |
| `UserService` | Auth facade + **demo** auth API (seed users + local accounts), profile, addresses, password change |
| `ContentService` | Testimonials, newsletter (mock) |
| `NotificationService` | MatSnackBar toasts with optional navigation action |
| `LoadingService` | In-flight request counter → global progress bar |
| `StorageService` | Safe `localStorage` wrapper (also used by the meta-reducer as plain functions) |

### HTTP pipeline

`loadingInterceptor → apiInterceptor → authInterceptor → errorInterceptor`

- **api**: adds `X-Client` header, simulates latency in dev (`environment.mockLatencyMs`)
- **auth**: attaches the demo bearer token
- **error**: retries GETs twice on 0/408/429/5xx with linear back-off, maps errors to friendly `AppError` messages, toasts unless the request sets the `SILENT_ERRORS` context token (when the page shows its own error state)

### Swapping in a real backend

1. Set `environment.apiBaseUrl` to the API origin and replace `apiUrl()` with REST paths.
2. Replace the `localStorage` override logic in services with POST/PUT/DELETE calls. Component code stays the same because components only use service methods and facades.
3. Replace `UserService` demo auth with OIDC and switch the auth interceptor to cookie-based sessions.
