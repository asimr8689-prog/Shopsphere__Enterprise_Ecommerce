# ShopSphere – Technology Stack

## Programming languages

| Language | Use |
|---|---|
| **TypeScript 5.8** (strict mode, `strictTemplates`) | All application logic, models, services, store, tests |
| **HTML5** | Angular templates with semantic landmarks (`header`, `nav`, `main`, `aside`, `article`), ARIA labels and the new `@if / @for / @switch / @let` control flow |
| **SCSS** | Global design tokens, breakpoints and mixins (`src/styles`), plus component-scoped styles |

## Frameworks

| Framework | Version | Why |
|---|---|---|
| **Angular** | 20.x | Batteries-included SPA framework: DI, router, forms and HttpClient in one coherent toolchain. Uses standalone components (no NgModules), signals (`signal`, `computed`, `effect`, `input`, `model`, `output`) and the esbuild-based application builder. |
| **Angular Material + CDK** | 20.x | Accessible, well-tested UI primitives (stepper, dialog, table, paginator, sort, menu, sidenav, chips, snackbar). Themed with the Material 3 `mat.theme()` API and aligned to ShopSphere's own tokens. |

> **Version note:** Angular 20 was chosen because it still ships the Karma/Jasmine test builder required by the brief, and NgRx, Material and ngx-echarts all have matching 20.x releases. Newer Angular majors can be adopted later with `ng update`.

## Libraries

| Library | Role |
|---|---|
| **@ngrx/store** | Global state for the *shared* slices only: `cart`, `wishlist`, `user` (session). Built with `createFeature`, `createActionGroup` and extra selectors. |
| **@ngrx/effects** | Side effects as functional effects: coupon validation (HTTP), login/register/profile API calls, move-to-cart orchestration, toast notifications, redirects. |
| **@ngrx/store-devtools** | Time-travel debugging in development. |
| **RxJS 7** | Async streams: debounced search (`debounceTime`, `distinctUntilChanged`, `switchMap`), retry with back-off in the error interceptor, `combineLatest` data composition, `shareReplay` caching. |
| **Apache ECharts + ngx-echarts** | Admin analytics (line + bar combo, donut, horizontal bar). Loaded with a dynamic `import('echarts')`, so only the admin chunk pays for it. |
| **Angular Router** | Lazy `loadComponent`/`loadChildren` routes, functional guards, `withComponentInputBinding` (route params → `input()`), view transitions, scroll restoration. |
| **Angular Reactive Forms** | Typed forms (`FormBuilder.nonNullable`), nested groups, `FormArray` (product specs), dynamic enable/disable (payment & address sections), custom validators. |
| **Angular HttpClient** | `withFetch()` + functional interceptors: loading, API headers/latency, auth token, error normalisation + retry. |

## State management approach

| State | Where | Why |
|---|---|---|
| Cart, wishlist, session | **NgRx** | Shared across many pages and the header; must persist; benefits from actions/effects/devtools |
| Server data (products, orders, categories) | **Services + RxJS** (`shareReplay`) | Cache-like data, not app state |
| Admin edits / placed orders | **Service signals** persisted to `localStorage` | Stand-in for a backend; isolated per service |
| Page/UI state (filters open, selected image, stepper, pagination) | **Component signals** | Local; NgRx would add ceremony without benefit |
| Catalogue filters | **URL query params** | Shareable, back-button friendly, survives refresh |

## Styling tools

- **SCSS** with a token layer (`_tokens.scss` → CSS custom properties), a no-output breakpoint map and mixins (`up()`, `down()`, `card`, `line-clamp`, `display-heading`).
- **Angular Material M3 theme** (`mat.theme`), tuned via `--mat-sys-*` variables.
- **Google Fonts**: *Plus Jakarta Sans* (display) and *Inter* (body); **Material Symbols Outlined** for icons.
- Responsive CSS Grid / Flexbox layouts, `prefers-reduced-motion` support and print styles for invoices.

## Development tools

| Tool | Use |
|---|---|
| **Angular CLI 20** (`@angular/build`) | Dev server, production build (esbuild), test runner |
| **Jasmine + Karma** | Unit tests (`*.spec.ts`) for reducers, pricing, query logic, validators, URL mapping and UI components |
| **Playwright** | Automated screenshot capture (`npm run screenshots`) |
| **npm** | Package management and scripts |
| **Git** | Version control – initialise with the commands in the README's *Git* section |
| **VS Code** | Recommended editor (install the *Angular Language Service* extension) |
| **EditorConfig** | Consistent formatting |

## Why these choices

1. **Angular is a contrast to Project 01.** InsightHub used React/Next.js. ShopSphere shows the same frontend skills in an opinionated, DI-driven framework that is common in enterprise teams.
2. **NgRx is used narrowly.** It holds shared state only, not every UI toggle. This follows the brief's "avoid unnecessary complexity" rule and mirrors how mature teams use it.
3. **Signals and RxJS work together.** Signals drive synchronous UI state, and RxJS handles async flows. `toSignal` and `toObservable` bridge the two.
4. **Offline-first mock API.** Static JSON is fetched through HttpClient, so swapping in a real API means changing only `environment.apiBaseUrl` and the service URLs. No API keys are needed, and none are exposed.
