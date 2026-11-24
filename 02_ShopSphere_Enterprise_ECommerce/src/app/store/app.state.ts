import { CartState } from './cart/cart.reducer';
import { UserState } from './user/user.reducer';
import { WishlistState } from './wishlist/wishlist.reducer';

/** Root NgRx state: only genuinely shared, cross-page state lives here. */
export interface AppState {
  cart: CartState;
  wishlist: WishlistState;
  user: UserState;
}
