import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/** Friendly empty state with optional projected actions. */
@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `
    <div class="icon"><mat-icon>{{ icon() }}</mat-icon></div>
    <h2>{{ title() }}</h2>
    @if (message()) {
      <p>{{ message() }}</p>
    }
    <div class="actions"><ng-content /></div>
  `,
  styleUrl: './state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input('inventory_2');
  readonly title = input.required<string>();
  readonly message = input<string>('');
}

/** Error state with a retry callback – parent decides how to retry (component communication via output). */
@Component({
  selector: 'app-error-state',
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="icon error"><mat-icon>cloud_off</mat-icon></div>
    <h2>{{ title() }}</h2>
    <p>{{ message() }}</p>
    <div class="actions">
      <button mat-flat-button type="button" (click)="retry.emit()"><mat-icon>refresh</mat-icon> Try again</button>
    </div>
  `,
  styleUrl: './state.scss',
  host: { role: 'alert' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  readonly title = input('We could not load this');
  readonly message = input('Please check your connection and try again.');
  readonly retry = output<void>();
}

/** Shimmering placeholder card used while products load. */
@Component({
  selector: 'app-product-card-skeleton',
  template: `
    <div class="sk sk-img"></div>
    <div class="sk sk-line w60"></div>
    <div class="sk sk-line"></div>
    <div class="sk sk-line w40"></div>
  `,
  styles: `
    :host { display: block; background: var(--ss-surface); border: 1px solid var(--ss-line); border-radius: var(--ss-radius); padding: 12px; }
    .sk { background: linear-gradient(90deg, #efe9e0 25%, #f8f4ee 50%, #efe9e0 75%); background-size: 200% 100%; animation: shimmer 1.3s infinite; border-radius: 8px; }
    .sk-img { aspect-ratio: 1; margin-bottom: 14px; }
    .sk-line { height: 12px; margin: 10px 0; }
    .w60 { width: 60%; } .w40 { width: 40%; }
    @keyframes shimmer { to { background-position: -200% 0; } }
  `,
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardSkeletonComponent {}
