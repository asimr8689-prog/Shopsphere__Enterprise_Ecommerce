# Screenshots

This folder is filled automatically by a Playwright script that drives the **running** app:

```bash
npm start                         # terminal 1 → http://localhost:4200
npx playwright install chromium   # first time only
npm run screenshots               # terminal 2
```

Captured views (desktop 1440×900 unless noted):

| File | View |
|---|---|
| `01-home.png` | Homepage (full page) |
| `02-catalog.png` | Catalogue with category filters + popularity sort |
| `03-catalog-search.png` | Search results for “laptop” |
| `04-product-details.png` | Product details with gallery and tabs |
| `05-cart.png` | Cart with two items |
| `06-checkout.png` | Checkout stepper |
| `07-account-orders.png` | Customer order history (demo account) |
| `08-order-tracking.png` | Order details with delivery tracker |
| `09-admin-dashboard.png` | Admin dashboard with ECharts |
| `10-admin-products.png` | Admin product management table |
| `11-mobile-home.png` | Homepage on a 390 px phone |
| `12-mobile-catalog.png` | Catalogue on a 390 px phone |

The screenshots have not been generated yet. The project was written in an environment without npm access, so the app could not be run there.
