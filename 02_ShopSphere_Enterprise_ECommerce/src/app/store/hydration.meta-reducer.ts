import { ActionReducer, INIT } from '@ngrx/store';
import { readStorage, writeStorage } from '@core/services/storage.service';
import { CartState } from './cart/cart.reducer';
import { UserState } from './user/user.reducer';
import { WishlistState } from './wishlist/wishlist.reducer';
import { AppState } from './app.state';

const KEY = 'state';

interface PersistedState {
  cart?: Pick<CartState, 'items' | 'coupon' | 'deliveryOptionId'>;
  wishlist?: WishlistState;
  user?: Pick<UserState, 'session'>;
}

/**
 * Persists cart, wishlist and session to localStorage and restores them synchronously on INIT,
 * so a page refresh keeps the cart and guards see the session immediately.
 * Only durable fields are stored – transient status/error flags are reset.
 */
export function hydrationMetaReducer(reducer: ActionReducer<AppState>): ActionReducer<AppState> {
  return (state, action) => {
    let next = reducer(state, action);

    if (action.type === INIT) {
      const saved = readStorage<PersistedState>(KEY, {});
      const session = saved.user?.session;
      const sessionValid = !!session && new Date(session.expiresAt).getTime() > Date.now();
      next = {
        ...next,
        cart: saved.cart ? { ...next.cart, ...saved.cart } : next.cart,
        wishlist: saved.wishlist ?? next.wishlist,
        user: sessionValid ? { ...next.user, session: session! } : next.user,
      };
      return next;
    }

    if (!state || state.cart !== next.cart || state.wishlist !== next.wishlist || state.user?.session !== next.user?.session) {
      const toSave: PersistedState = {
        cart: { items: next.cart.items, coupon: next.cart.coupon, deliveryOptionId: next.cart.deliveryOptionId },
        wishlist: next.wishlist,
        user: { session: next.user.session },
      };
      writeStorage(KEY, toSave);
    }
    return next;
  };
}
