import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rating-stars',
  imports: [MatIconModule, DecimalPipe],
  template: `
    <span class="stars" [attr.aria-label]="'Rated ' + (rating() | number: '1.1-1') + ' out of 5'" role="img">
      @for (s of stars(); track $index) {
        <mat-icon class="star" [class.filled]="s !== 'empty'" aria-hidden="true">{{ s === 'half' ? 'star_half' : 'star' }}</mat-icon>
      }
    </span>
    @if (showValue()) {
      <span class="value">{{ rating() | number: '1.1-1' }}</span>
    }
    @if (count() !== null) {
      <span class="count">({{ count() | number }})</span>
    }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
    .stars { display: inline-flex; }
    .star { width: var(--star-size, 16px); height: var(--star-size, 16px); font-size: var(--star-size, 16px); color: #d6cfc4; }
    .star.filled { color: var(--ss-gold); font-variation-settings: 'FILL' 1; }
    .value { font-weight: 600; color: var(--ss-ink); }
    .count { color: var(--ss-text-muted); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingStarsComponent {
  readonly rating = input.required<number>();
  readonly count = input<number | null>(null);
  readonly showValue = input(false);

  readonly stars = computed<('full' | 'half' | 'empty')[]>(() => {
    const r = Math.max(0, Math.min(5, this.rating()));
    return Array.from({ length: 5 }, (_, i) => (r >= i + 0.75 ? 'full' : r >= i + 0.25 ? 'half' : 'empty'));
  });
}
