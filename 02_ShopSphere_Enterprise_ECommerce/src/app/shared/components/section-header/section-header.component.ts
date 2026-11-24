import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-section-header',
  imports: [RouterLink, MatIconModule],
  template: `
    <div>
      @if (eyebrow()) {
        <span class="eyebrow">{{ eyebrow() }}</span>
      }
      <h2>{{ title() }}</h2>
      @if (subtitle()) {
        <p>{{ subtitle() }}</p>
      }
    </div>
    @if (link()) {
      <a [routerLink]="link()" [queryParams]="linkParams()" class="see-all">{{ linkLabel() }} <mat-icon>arrow_forward</mat-icon></a>
    }
  `,
  styles: `
    :host { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: var(--ss-space-5); }
    .eyebrow { text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px; font-weight: 700; color: var(--ss-coral-strong); }
    h2 { font-size: clamp(1.35rem, 2vw, 1.8rem); margin: 4px 0 0; }
    p { margin: 6px 0 0; color: var(--ss-text-muted); }
    .see-all { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; text-decoration: none; color: var(--ss-ink); white-space: nowrap; }
    .see-all mat-icon { font-size: 18px; width: 18px; height: 18px; transition: transform var(--ss-duration) var(--ss-ease); }
    .see-all:hover mat-icon { transform: translateX(3px); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly eyebrow = input('');
  readonly link = input<string | null>(null);
  readonly linkParams = input<Record<string, string> | null>(null);
  readonly linkLabel = input('See all');
}
