import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { Session } from '@core/models';
import { AuthActions, ProfileActions } from './user.actions';

export interface UserState {
  session: Session | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

export const initialUserState: UserState = { session: null, status: 'idle', error: null };

export const userReducer = createReducer(
  initialUserState,
  on(AuthActions.login, AuthActions.register, ProfileActions.updateProfile, (state): UserState => ({
    ...state,
    status: 'loading',
    error: null,
  })),
  on(AuthActions.loginSuccess, AuthActions.registerSuccess, (_state, { session }): UserState => ({
    session,
    status: 'idle',
    error: null,
  })),
  on(AuthActions.loginFailure, AuthActions.registerFailure, ProfileActions.updateProfileFailure, (state, { error }): UserState => ({
    ...state,
    status: 'error',
    error,
  })),
  on(ProfileActions.updateProfileSuccess, (state, { user }): UserState => ({
    ...state,
    session: state.session ? { ...state.session, user } : state.session,
    status: 'idle',
    error: null,
  })),
  on(AuthActions.logout, AuthActions.sessionExpired, (): UserState => initialUserState),
  on(AuthActions.clearError, (state): UserState => ({ ...state, status: 'idle', error: null })),
);

export const userFeature = createFeature({
  name: 'user',
  reducer: userReducer,
  extraSelectors: ({ selectSession }) => {
    const selectCurrentUser = createSelector(selectSession, (s) => s?.user ?? null);
    const selectIsLoggedIn = createSelector(selectSession, (s) => !!s);
    const selectIsAdmin = createSelector(selectCurrentUser, (u) => u?.role === 'admin');
    const selectToken = createSelector(selectSession, (s) => s?.token ?? null);
    const selectDefaultAddress = createSelector(
      selectCurrentUser,
      (u) => u?.addresses.find((a) => a.isDefault) ?? u?.addresses[0] ?? null,
    );
    return { selectCurrentUser, selectIsLoggedIn, selectIsAdmin, selectToken, selectDefaultAddress };
  },
});

export const {
  selectCurrentUser,
  selectIsLoggedIn,
  selectIsAdmin,
  selectToken,
  selectDefaultAddress,
  selectStatus: selectAuthStatus,
  selectError: selectAuthError,
} = userFeature;
