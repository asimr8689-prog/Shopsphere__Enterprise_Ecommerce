import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Product } from '@core/models';

export const WishlistActions = createActionGroup({
  source: 'Wishlist',
  events: {
    Toggle: props<{ productId: string }>(),
    Add: props<{ productId: string }>(),
    Remove: props<{ productId: string }>(),
    Clear: emptyProps(),
    'Move To Cart': props<{ product: Product }>(),
  },
});
