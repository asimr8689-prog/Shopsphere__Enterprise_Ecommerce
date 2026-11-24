/**
 * Production environment.
 * No secrets live here – everything in src/ ships to the browser.
 */
export const environment = {
  production: true,
  appName: 'ShopSphere',
  /** Base URL for the mock REST layer (static JSON in /public/data). Swap for a real API later. */
  apiBaseUrl: 'data',
  /** Simulated network latency in ms for the mock API (0 in production builds). */
  mockLatencyMs: 0,
  freeShippingThreshold: 99,
  taxRate: 0.08,
  currency: 'USD',
};
