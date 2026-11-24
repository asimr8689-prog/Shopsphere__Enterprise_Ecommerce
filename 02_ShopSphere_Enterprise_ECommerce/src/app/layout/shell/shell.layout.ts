import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

/** Storefront shell: sticky header, routed page, footer. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <a class="skip-link" href="#main">Skip to content</a>
    <app-header />
    <main id="main" tabindex="-1"><router-outlet /></main>
    <app-footer />
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    main { flex: 1; outline: none; }
    .skip-link { position: absolute; left: -999px; top: 8px; z-index: 1000; background: var(--ss-ink); color: #fff; padding: 8px 14px; border-radius: 8px; }
    .skip-link:focus { left: 8px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellLayout {}
