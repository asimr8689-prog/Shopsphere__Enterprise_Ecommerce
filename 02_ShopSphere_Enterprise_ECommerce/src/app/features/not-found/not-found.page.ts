import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { EmptyStateComponent } from '@shared/components/state/state.components';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, MatButtonModule, EmptyStateComponent],
  template: `
    <div class="container page">
      <app-empty-state icon="travel_explore" title="We couldn't find that page" message="The link may be broken or the page may have moved.">
        <a mat-flat-button routerLink="/">Back to home</a>
        <a mat-stroked-button routerLink="/products">Browse products</a>
      </app-empty-state>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
