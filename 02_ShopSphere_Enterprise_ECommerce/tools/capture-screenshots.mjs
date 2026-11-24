// Captures portfolio screenshots of the running app into ./screenshots.
// Usage:
//   1) npm start                       (in one terminal – serves http://localhost:4200)
//   2) npx playwright install chromium (first time only)
//   3) npm run screenshots
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4200';
const OUT = new URL('../screenshots/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await desktop.newPage();

async function shot(name, path, { full = false, wait = 900 } = {}) {
  if (path) await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${OUT}${name}.png`, fullPage: full });
  console.log('saved', name);
}

async function login(email, password) {
  await page.goto(`${BASE}/account/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type=email]', email);
  await page.fill('input[formcontrolname=password]', password);
  await page.click('button[type=submit]');
  await page.waitForTimeout(1200);
}

await shot('01-home', '/', { full: true, wait: 1500 });
await shot('02-catalog', '/products?category=audio,wearables&sort=popularity');
await shot('03-catalog-search', '/products?q=laptop');
await shot('04-product-details', '/products/aurora-studio-pro-headphones', { wait: 1200 });
await page.click('button.add');
await page.goto(`${BASE}/products/terra-cloudrunner`, { waitUntil: 'networkidle' });
await page.click('button.add');
await shot('05-cart', '/cart', { wait: 1200 });
await shot('06-checkout', '/checkout', { wait: 1200 });
await login('demo@shopsphere.dev', 'Demo@1234');
await shot('07-account-orders', '/account/orders');
await page.click('.order a');
await shot('08-order-tracking', null, { wait: 1200 });
await page.evaluate(() => localStorage.removeItem('shopsphere:state'));
await login('admin@shopsphere.dev', 'Admin@1234');
await shot('09-admin-dashboard', '/admin/dashboard', { wait: 2000 });
await shot('10-admin-products', '/admin/products');

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const m = await mobile.newPage();
await m.goto(BASE + '/', { waitUntil: 'networkidle' });
await m.waitForTimeout(1200);
await m.screenshot({ path: `${OUT}11-mobile-home.png` });
await m.goto(BASE + '/products', { waitUntil: 'networkidle' });
await m.waitForTimeout(900);
await m.screenshot({ path: `${OUT}12-mobile-catalog.png` });
console.log('saved mobile screenshots');

await browser.close();
