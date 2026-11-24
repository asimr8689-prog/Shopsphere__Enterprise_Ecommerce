import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Coupon, DeliveryOption, Product } from '@core/models';

export const CartActions = createActionGroup({
  source: 'Cart',
  events: {
    'Add Item': props<{ product: Product; quantity: number }>(),
    'Remove Item': props<{ productId: string }>(),
    'Update Quantity': props<{ productId: string; quantity: number }>(),
    'Clear Cart': emptyProps(),
    'Apply Coupon': props<{ code: string }>(),
    'Apply Coupon Success': props<{ coupon: Coupon }>(),
    'Apply Coupon Failure': props<{ error: string }>(),
    'Remove Coupon': emptyProps(),
    'Set Delivery Option': props<{ optionId: DeliveryOption['id'] }>(),
  },
});
