# ShopSphere – Enterprise E-Commerce Platform

**Portfolio Project 02** · Frontend Development · Angular 20 · NgRx · Angular Material · RxJS · Apache ECharts

ShopSphere is an online store frontend. Shoppers can browse a catalogue, search, filter and sort products, view product details, manage a cart and wishlist, check out in several steps, and track their orders. Admins get a separate dashboard with sales analytics and product, category, order and inventory management.

It is a deliberate contrast to Project 01 (InsightHub, a React/Next.js SaaS analytics dashboard). ShopSphere is a consumer storefront built with Angular. It has its own design system: warm sand surfaces, deep ink text and a coral accent.

> **Status: In Progress.** All features are coded. The pure business logic (cart pricing, coupons, catalogue filtering/sorting/pagination, dashboard aggregation, input masks, pipes) was run and passed against the mock data. The app has **not yet been installed, compiled with `ng build`, or tested in a browser**. It was written in an environment without npm registry access. See [Verification status](#verification-status).

---

## Objectives

- Build a realistic, polished e-commerce UI with modern Angular: standalone components, signals, the new control flow, and functional guards and interceptors.
- Use **NgRx** only for shared state (cart, wishlist, user session) and keep page-local state in **signals**.
- Show production patterns: lazy routes, guards, interceptors with retry, typed reactive forms with custom validators, and loading/error/empty states.
- Keep everything runnable offline. The mock JSON "API" ships in `public/data`, and local persistence uses `localStorage`.

## Features

| Area | Highlights |
|---|---|
| **Homepage** | Auto-rotating hero carousel, category tiles, featured / trending / best-seller grids, special-offers panel, promo banners, brand strip, testimonials, FAQ, newsletter form, rich footer |
| **Catalogue** | Search with debounced type-ahead suggestions; filters for category, brand, price range (inputs + quick ranges), rating, in-stock and on-sale; 6 sort options; pagination; removable filter chips. All state lives in the URL, so it is shareable and survives refresh |
| **Product details** | Image gallery with thumbnails and hover zoom, price/discount, stock status, quantity selector, add to cart, buy now, wishlist toggle, description / specifications / reviews tabs with rating breakdown, related products |
| **Cart** | Add, remove, update quantity (capped at stock), save for later, delivery options, coupons (`SAVE10`, `WELCOME20`, `FLAT25`, `FREESHIP`), free-shipping progress, subtotal / savings / discount / shipping / tax / total, persisted across refresh, empty state |
| **Wishlist** | Toggle from any product card, list view, move to cart, persisted |
| **Checkout** | 4-step linear stepper (contact → shipping & delivery → payment → review), saved-address picker, validation (Luhn card check, expiry, phone, postal code), **mock payment clearly labelled**, order confirmation page |
| **Account** | Register (password strength meter), login (demo accounts), profile editing, address book (add / edit / delete / default), notification preferences, change password, reset demo data |
| **Orders** | Order history with status filters and search, delivery-tracking stepper, activity timeline, printable invoice preview, cancel (before shipping), buy again |
| **Admin** | KPIs, ECharts revenue / orders trend, orders-by-status donut, sales by category, inventory alerts, recent orders; product CRUD (dialog form with FormArray specs), category management, order status workflow, inventory adjustments |

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Customer | `demo@shopsphere.dev` | `Demo@1234` |
| Admin | `admin@shopsphere.dev` | `Admin@1234` |

> **Demo authentication only.** Credentials are checked in the browser against mock data, and sessions are random tokens in `localStorage`. This shows the UI flows, guards and interceptors. It is **not** secure authentication. See *Future improvements*.

## Screenshots

Screenshots are produced by an automated script against the running app (see [`screenshots/README.md`](screenshots/README.md)):

```bash
npm start                            # terminal 1
npx playwright install chromium      # first time only
npm run screenshots                  # terminal 2 → saves PNGs into ./screenshots
```

*(The screenshots folder is empty until this has been run, because the app has not been executed yet.)*

## Technology stack

HTML5 · SCSS · TypeScript (strict) · Angular 20 (standalone, signals, control flow) · Angular Material 20 (M3 theme) + CDK · NgRx Store / Effects / Selectors / Store DevTools · RxJS 7 · Angular Router · Reactive Forms · Apache ECharts via ngx-echarts · HttpClient (fetch backend) · Jasmine + Karma · Git · npm.

See [TECH_STACK.md](TECH_STACK.md) for the reasoning behind each choice.

## Installation

Requirements: **Node.js 20.19+ or 22.12+** and npm 10+.

```bash
cd 02_ShopSphere_Enterprise_ECommerce
npm install
```

## Local development

```bash
npm start            # ng serve → http://localhost:4200 (350 ms simulated API latency)
npm test             # Karma + Jasmine unit tests (Chrome)
npm run test:ci      # headless single run
npm run typecheck    # TypeScript only
```

## Git

The project is ready for version control (`.gitignore` included). From this folder:

```bash
git init -b main
git add .
git commit -m "Initial commit: ShopSphere Angular e-commerce platform"
# later: git remote add origin https://github.com/<you>/shopsphere.git && git push -u origin main
```

## Production build

```bash
npm run build        # → dist/shopsphere/browser
npx serve -s dist/shopsphere/browser   # preview locally (-s = single-page-app fallback)
```

Deep links like `/products/…` need SPA fallback on the host, meaning every path should serve `index.html`. On Netlify, add `/* /index.html 200` to a `_redirects` file. On Vercel, add a rewrite.

## Project architecture

```
src/
├── app/
│   ├── core/            models · services (Product, Category, Cart, Wishlist, Order, User, …)
│   │                    guards · interceptors · validators · utils
│   ├── shared/          components (product card, price tag, rating, quantity, states, order summary…)
│   │                    directives (img fallback, click outside, input mask) · pipes
│   ├── store/           NgRx: cart · wishlist · user  (+ hydration meta-reducer)
│   ├── layout/          shell, header (search + menus), footer
│   ├── features/        home · products · product-details · cart · wishlist · checkout
│   │                    account · orders · admin · not-found
│   ├── app.config.ts    providers (router, http + interceptors, store, effects, echarts)
│   └── app.routes.ts    lazy routes + guards
├── environments/
└── styles/              design tokens, breakpoints, mixins
public/
├── data/                mock REST API (products, categories, orders, users, coupons, testimonials)
└── images/              generated SVG product art, banners, placeholder
```

Details: [ARCHITECTURE.md](ARCHITECTURE.md). Feature checklist: [FEATURES.md](FEATURES.md).

## What needs a backend

Everything runs in the browser for portfolio purposes. A real deployment would move these to a server:

- **Authentication**: identity provider (OIDC/OAuth), hashed passwords, HttpOnly session cookies.
- **Payments**: a PCI-compliant provider (e.g. Stripe Payment Element). Card data must never touch our own frontend state.
- **Orders, inventory, admin CRUD**: database plus an API with authorisation. Today they are stored in `localStorage` per browser.
- **Coupons and pricing**: server-side validation. Client-side totals are only estimates.
- **Newsletter, emails, delivery tracking**: real providers and webhooks.
- **Image upload**: object storage. The admin can currently only choose existing artwork.

## Verification status

| Check | Result |
|---|---|
| TypeScript check of all app code (`tsc`, strict) | ✅ 0 errors in project code. Angular/RxJS typings were unavailable, so library calls were not type-checked |
| Template import audit (custom script: every tag / directive / pipe vs. component `imports`) | ✅ 0 missing, 0 unused |
| Business-logic run against the mock data (cart totals, coupons, filters, sorting, pagination, search, dashboard stats, masks, data integrity) | ✅ 37/37 passed |
| Framework-free unit specs (`cart.utils.spec`, `product-query.spec`, pipes) | ✅ 15/15 passed |
| `npm install`, `ng build`, `ng test`, browser testing of routes, forms, responsive layouts | ⏳ **Not yet run.** Do this first on a machine with npm access |

## Future improvements

- Real backend (NestJS or .NET) with auth, payments (Stripe test mode), and orders/inventory in PostgreSQL.
- Playwright end-to-end tests for the checkout and admin flows.
- SSR / prerendering with `@angular/ssr` for SEO on product pages.
- Customer reviews submission, product comparison, recently viewed, i18n and multi-currency.
- Dark mode using the existing token system.
- PWA offline support.

---

Part of the **Frontend Development Portfolio**. Project 01: InsightHub – SaaS Analytics Dashboard. Project 02: ShopSphere.
