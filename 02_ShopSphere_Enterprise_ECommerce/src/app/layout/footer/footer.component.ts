import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, MatIconModule],
  template: `
    <section class="perks container" aria-label="Store benefits">
      @for (perk of perks; track perk.title) {
        <div class="perk">
          <mat-icon>{{ perk.icon }}</mat-icon>
          <div><strong>{{ perk.title }}</strong><span>{{ perk.text }}</span></div>
        </div>
      }
    </section>
    <footer class="footer">
      <div class="container grid">
        <div class="brand">
          <a routerLink="/" class="logo">Shop<span>Sphere</span></a>
          <p>Premium electronics, footwear, travel and home essentials – curated and delivered fast.</p>
          <p class="demo-note">Portfolio demo: no real payments, accounts or deliveries are processed.</p>
        </div>
        <nav aria-label="Shop">
          <h3>Shop</h3>
          <a routerLink="/products">All products</a>
          <a routerLink="/products" [queryParams]="{ sort: 'popularity' }">Best sellers</a>
          <a routerLink="/products" [queryParams]="{ sale: 1 }">Deals</a>
          <a routerLink="/products" [queryParams]="{ sort: 'newest' }">New arrivals</a>
        </nav>
        <nav aria-label="Account">
          <h3>Account</h3>
          <a routerLink="/account">My account</a>
          <a routerLink="/account/orders">Order tracking</a>
          <a routerLink="/wishlist">Wishlist</a>
          <a routerLink="/cart">Cart</a>
        </nav>
        <nav aria-label="Help">
          <h3>Help</h3>
          <a routerLink="/" fragment="faq">Shipping &amp; delivery</a>
          <a routerLink="/" fragment="faq">Returns &amp; refunds</a>
          <a routerLink="/" fragment="newsletter">Newsletter</a>
          <a routerLink="/admin">Admin dashboard</a>
        </nav>
      </div>
      <div class="container bottom">
        <span>© {{ year }} ShopSphere. Built with Angular as a frontend portfolio project.</span>
        <span class="pay" aria-label="Accepted payment methods (demo)">
          <mat-icon>credit_card</mat-icon><mat-icon>account_balance_wallet</mat-icon><mat-icon>payments</mat-icon>
        </span>
      </div>
    </footer>
  `,
  styles: `
    :host { display: block; margin-top: var(--ss-space-8); }
    .perks { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--ss-space-4); margin-bottom: var(--ss-space-7); }
    .perk { display: flex; gap: 14px; align-items: center; padding: 18px; background: var(--ss-surface); border: 1px solid var(--ss-line); border-radius: var(--ss-radius); }
    .perk mat-icon { color: var(--ss-coral-strong); background: var(--ss-coral-soft); border-radius: 12px; padding: 10px; width: 44px; height: 44px; box-sizing: border-box; }
    .perk div { display: flex; flex-direction: column; } .perk span { color: var(--ss-text-muted); font-size: 13px; }
    .footer { background: var(--ss-ink); color: #c7cbe0; padding-top: var(--ss-space-7); }
    .grid { display: grid; gap: var(--ss-space-6); grid-template-columns: 2fr repeat(3, 1fr); }
    @media (max-width: 899px) { .grid { grid-template-columns: 1fr 1fr; } .brand { grid-column: 1 / -1; } }
    .logo { font-family: var(--ss-font-display); font-weight: 800; font-size: 1.5rem; color: #fff; text-decoration: none; }
    .logo span { color: var(--ss-coral); }
    .brand p { max-width: 360px; font-size: 14px; } .demo-note { color: #8f96b3; font-size: 12.5px !important; }
    h3 { color: #fff; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; }
    nav { display: flex; flex-direction: column; gap: 10px; }
    nav a { color: #c7cbe0; text-decoration: none; font-size: 14px; } nav a:hover { color: #fff; }
    .bottom { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,0.1); margin-top: var(--ss-space-6); padding-block: var(--ss-space-5); font-size: 13px; }
    .pay { display: inline-flex; gap: 8px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
  readonly perks = [
    { icon: 'local_shipping', title: 'Free delivery', text: 'On standard orders over $99' },
    { icon: 'autorenew', title: '30-day returns', text: 'Hassle-free, no questions asked' },
    { icon: 'verified_user', title: 'Secure checkout', text: 'Demo flow – no real charges' },
    { icon: 'support_agent', title: 'Expert support', text: '7 days a week via chat & email' },
  ];
}
