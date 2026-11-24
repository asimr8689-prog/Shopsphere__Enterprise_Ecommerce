import { Pipe, PipeTransform } from '@angular/core';
import { OrderStatus } from '@core/models';

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: string; icon: string }> = {
  pending: { label: 'Pending', tone: 'warning', icon: 'schedule' },
  processing: { label: 'Processing', tone: 'info', icon: 'inventory_2' },
  shipped: { label: 'Shipped', tone: 'info', icon: 'local_shipping' },
  'out-for-delivery': { label: 'Out for delivery', tone: 'coral', icon: 'delivery_truck_speed' },
  delivered: { label: 'Delivered', tone: 'success', icon: 'check_circle' },
  cancelled: { label: 'Cancelled', tone: 'danger', icon: 'cancel' },
};

/** {{ order.status | orderStatus }} → "Out for delivery"; {{ status | orderStatus:'tone' }} → "coral". */
@Pipe({ name: 'orderStatus' })
export class OrderStatusPipe implements PipeTransform {
  transform(status: OrderStatus | null | undefined, field: 'label' | 'tone' | 'icon' = 'label'): string {
    return status ? ORDER_STATUS_META[status][field] : '';
  }
}
