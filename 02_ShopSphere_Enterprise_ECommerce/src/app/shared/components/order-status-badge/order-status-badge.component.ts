import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { OrderStatus } from '@core/models';
import { OrderStatusPipe } from '../../pipes/order-status.pipe';

@Component({
  selector: 'app-order-status-badge',
  imports: [MatIconModule, OrderStatusPipe],
  template: `
    <span class="badge {{ status() | orderStatus: 'tone' }}">
      <mat-icon>{{ status() | orderStatus: 'icon' }}</mat-icon>{{ status() | orderStatus }}
    </span>
  `,
  styles: `mat-icon { font-size: 15px; width: 15px; height: 15px; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStatusBadgeComponent {
  readonly status = input.required<OrderStatus>();
}
