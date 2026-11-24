import { ActionReducerMap } from '@ngrx/store';
import { AppState } from './app.state';
import { cartFeature } from './cart/cart.reducer';
import { userFeature } from './user/user.reducer';
import { wishlistFeature } from './wishlist/wishlist.reducer';
import * as cartEffects from './cart/cart.effects';
import * as userEffects from './user/user.effects';
import * as wishlistEffects from './wishlist/wishlist.effects';

export const reducers: ActionReducerMap<AppState> = {
  [cartFeature.name]: cartFeature.reducer,
  [wishlistFeature.name]: wishlistFeature.reducer,
  [userFeature.name]: userFeature.reducer,
};

export const effects = [cartEffects, wishlistEffects, userEffects];

export { hydrationMetaReducer } from './hydration.meta-reducer';
export type { AppState } from './app.state';
