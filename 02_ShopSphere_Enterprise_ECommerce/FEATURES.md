# ShopSphere – Feature Checklist

**Status legend**

- ✅ **Completed**: implemented in code.
- 🟡 **Partially completed**: implemented with a deliberate limitation (usually needs a backend).
- ⏳ **Pending**: not done yet.

**Verified column**

- **Logic ✔**: the underlying logic was executed and passed against the mock data.
- **Not yet**: awaiting `npm install` + `ng serve` browser testing. The code was written without npm access, so nothing has been rendered in a browser yet.

## A. Homepage

| Feature | Status | Verified |
|---|---|---|
| Navigation bar (sticky, promo strip, category nav, mobile drawer) | ✅ | Not yet |
| Logo & brand identity | ✅ | Not yet |
| Search bar with debounced suggestions | ✅ | Logic ✔ (search scoring) |
| Product categories | ✅ | Not yet |
| Hero banner (auto-rotating carousel, controls) | ✅ | Not yet |
| Featured / trending / best-selling products | ✅ | Not yet |
| Special offers (sorted by discount) | ✅ | Not yet |
| Promotional banners | ✅ | Not yet |
| Customer reviews (testimonials) | ✅ | Not yet |
| Newsletter subscription (validated; stored locally) | 🟡 Mock – no email provider | Not yet |
| Footer with useful links | ✅ | Not yet |

## B. Product catalogue

| Feature | Status | Verified |
|---|---|---|
| Product listing, images, names, descriptions | ✅ | Not yet |
| Prices & discount prices | ✅ | Logic ✔ |
| Ratings, stock availability | ✅ | Logic ✔ |
| Search | ✅ | Logic ✔ |
| Category / brand / price range / rating filters | ✅ | Logic ✔ |
| In-stock & on-sale filters | ✅ | Logic ✔ |
| Sort by price / popularity / rating / newest | ✅ | Logic ✔ |
| Pagination (with page-size options, clamping) | ✅ | Logic ✔ |
| URL-synced filters + removable chips | ✅ | Not yet |
| Loading skeletons, error + retry, empty state | ✅ | Not yet |

## C. Product details

| Feature | Status | Verified |
|---|---|---|
| Multiple images, gallery, thumbnails, hover zoom | ✅ | Not yet |
| Title, price, discount, description, specifications | ✅ | Not yet |
| Customer reviews + rating breakdown | ✅ (display) | Not yet |
| Write a review | ⏳ Pending | – |
| Quantity selector (capped at stock) | ✅ | Not yet |
| Add to cart, buy now, add to wishlist | ✅ | Not yet |
| Related products | ✅ | Not yet |

## D. Shopping cart

| Feature | Status | Verified |
|---|---|---|
| Add / remove / update quantities | ✅ | Logic ✔ (reducer spec written; pricing run) |
| Subtotal, discounts, delivery, tax, final total | ✅ | Logic ✔ |
| Coupon codes (`SAVE10`, `WELCOME20`, `FLAT25`, `FREESHIP`) | ✅ | Logic ✔ |
| Persist after refresh (NgRx meta-reducer → localStorage) | ✅ | Not yet |
| Empty cart state, save for later, free-shipping progress | ✅ | Not yet |

## E. Wishlist

| Feature | Status | Verified |
|---|---|---|
| Add / remove / view saved products | ✅ | Not yet |
| Move to cart (NgRx effect) | ✅ | Not yet |
| Persistence | ✅ | Not yet |

## F. Checkout

| Feature | Status | Verified |
|---|---|---|
| Customer information step | ✅ | Not yet |
| Shipping address (saved address picker or new) | ✅ | Not yet |
| Delivery options | ✅ | Logic ✔ (pricing) |
| Order summary with coupon | ✅ | Not yet |
| Payment method selection (card / PayPal / cash on delivery) | 🟡 Simulated – no payment provider | Not yet |
| Form validation (Luhn, expiry, phone, postal code, required) | ✅ | Validator specs written |
| Stock re-check before placing the order | ✅ | Not yet |
| Order confirmation page (clearly states no payment was processed) | ✅ | Not yet |

## G. Customer account

| Feature | Status | Verified |
|---|---|---|
| Registration (password strength, confirm match, terms) | 🟡 Demo auth (browser-only) | Not yet |
| Login (demo accounts, remember me, return URL) | 🟡 Demo auth (browser-only) | Not yet |
| Profile management | ✅ | Not yet |
| Address management (add / edit / delete / default) | ✅ | Not yet |
| Order history & order details | ✅ | Not yet |
| Wishlist link | ✅ | Not yet |
| Account settings (preferences, change password, reset demo data) | ✅ | Not yet |

## H. Order management

| Feature | Status | Verified |
|---|---|---|
| Order listing (status filter + search) | ✅ | Not yet |
| Order details & status | ✅ | Not yet |
| Delivery tracking interface (stepper + activity timeline) | 🟡 Simulated tracking events | Not yet |
| Invoice preview (print / save as PDF) | ✅ | Not yet |
| Cancel before shipping, buy again | ✅ | Not yet |

## I. Admin dashboard

| Feature | Status | Verified |
|---|---|---|
| Dashboard overview KPIs (products, orders, revenue, AOV, customers) | ✅ | Logic ✔ |
| Revenue analytics (ECharts, 12 months) | ✅ | Logic ✔ (aggregation) |
| Orders by status, sales by category charts | ✅ | Logic ✔ (aggregation) |
| Product management – add / edit / delete | 🟡 Stored in localStorage | Not yet |
| Product image upload | 🟡 Choose existing artwork only (needs storage backend) | – |
| Category management | 🟡 Stored in localStorage | Not yet |
| Order management (status workflow) | 🟡 Stored in localStorage | Not yet |
| Inventory status & adjustments | ✅ | Not yet |
| Admin route protection (`canMatch` guard) | ✅ | Not yet |

## Angular concepts demonstrated

| # | Concept | Where |
|---|---|---|
| 1 | Standalone components | Every component, no NgModules |
| 2 | Services | `core/services/*` |
| 3 | Dependency injection | `inject()` throughout; `providedIn: 'root'` |
| 4 | Signals | `signal`, `computed`, `effect`, `input`, `model`, `output`, `selectSignal`, `toSignal` |
| 5 | RxJS Observables | Search type-ahead, `combineLatest`, `shareReplay`, retry |
| 6 | NgRx Store | `store/cart`, `store/wishlist`, `store/user` |
| 7 | NgRx Effects | Coupon validation, auth, profile updates, move-to-cart, toasts |
| 8 | NgRx Selectors | Feature + extra selectors, factory selectors, memoised totals |
| 9 | Angular Router | `app.routes.ts`, `account.routes.ts`, `admin.routes.ts` |
| 10 | Lazy-loaded routes | All pages via `loadComponent` / `loadChildren` |
| 11 | Route guards | `authGuard`, `guestGuard`, `adminGuard` (canMatch), `cartNotEmptyGuard` |
| 12 | HTTP interceptors | loading, api, auth, error (+retry) |
| 13 | Reactive Forms | Checkout, account, admin product dialog (FormArray) |
| 14 | Custom validators | `CustomValidators` (password, match, phone, postal, Luhn, expiry, price) |
| 15 | Reusable components | Product card, price tag, rating stars, quantity selector, order summary, states |
| 16 | Custom directives | `appImgFallback`, `appClickOutside`, `appInputMask` |
| 17 | Pipes | `discount`, `orderStatus`, `truncate` + built-ins |
| 18 | Component communication | `input()`/`output()`/`model()` (filters panel ↔ catalogue, quantity selector, error retry), content projection |
| 19 | Error handling | Error interceptor, `Loadable` states, retry buttons, image fallback |
| 20 | API integration | HttpClient against the mock REST layer (`public/data`) |

## Quality

| Item | Status |
|---|---|
| Unit specs (6 files: reducer, pricing, query, validators, URL params, UI components) | ✅ Written. Framework-free specs executed 15/15; Karma run ⏳ |
| `npm install` / `ng build` / `ng test` | ⏳ Pending (no npm access when written) |
| Browser testing of routes, responsive layouts, persistence | ⏳ Pending |
| Screenshots | ⏳ Pending: run `npm run screenshots` |
| End-to-end tests | ⏳ Pending |
