import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, filter, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { errorMessage } from '@core/services/api';
import { NotificationService } from '@core/services/notification.service';
import { UserService } from '@core/services/user.service';
import { AuthActions, ProfileActions } from './user.actions';
import { selectCurrentUser } from './user.reducer';

export const login$ = createEffect(
  (actions$ = inject(Actions), users = inject(UserService)) =>
    actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ credentials, returnUrl }) =>
        users.login(credentials).pipe(
          map((session) => AuthActions.loginSuccess({ session, returnUrl })),
          catchError((err) => of(AuthActions.loginFailure({ error: errorMessage(err) }))),
        ),
      ),
    ),
  { functional: true },
);

export const register$ = createEffect(
  (actions$ = inject(Actions), users = inject(UserService)) =>
    actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ payload, returnUrl }) =>
        users.register(payload).pipe(
          map((session) => AuthActions.registerSuccess({ session, returnUrl })),
          catchError((err) => of(AuthActions.registerFailure({ error: errorMessage(err) }))),
        ),
      ),
    ),
  { functional: true },
);

export const authRedirect$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router), notify = inject(NotificationService)) =>
    actions$.pipe(
      ofType(AuthActions.loginSuccess, AuthActions.registerSuccess),
      tap(({ session, returnUrl, type }) => {
        const welcome = type === AuthActions.registerSuccess.type ? 'Account created' : 'Welcome back';
        notify.success(`${welcome}, ${session.user.firstName}!`);
        const fallback = session.user.role === 'admin' ? '/admin' : '/account';
        router.navigateByUrl(returnUrl && returnUrl.startsWith('/') ? returnUrl : fallback);
      }),
    ),
  { functional: true, dispatch: false },
);

export const logout$ = createEffect(
  (actions$ = inject(Actions), router = inject(Router), notify = inject(NotificationService)) =>
    actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        notify.info('You have been signed out');
        router.navigateByUrl('/');
      }),
    ),
  { functional: true, dispatch: false },
);

export const updateProfile$ = createEffect(
  (actions$ = inject(Actions), store = inject(Store), users = inject(UserService)) =>
    actions$.pipe(
      ofType(ProfileActions.updateProfile),
      withLatestFrom(store.select(selectCurrentUser)),
      filter(([, user]) => !!user),
      switchMap(([{ changes, successMessage }, user]) =>
        users.updateUser(user!.id, changes).pipe(
          map((updated) => ProfileActions.updateProfileSuccess({ user: updated, successMessage })),
          catchError((err) => of(ProfileActions.updateProfileFailure({ error: errorMessage(err) }))),
        ),
      ),
    ),
  { functional: true },
);

export const profileToasts$ = createEffect(
  (actions$ = inject(Actions), notify = inject(NotificationService)) =>
    actions$.pipe(
      ofType(ProfileActions.updateProfileSuccess, ProfileActions.updateProfileFailure),
      tap((action) =>
        action.type === ProfileActions.updateProfileSuccess.type
          ? notify.success(action.successMessage ?? 'Profile updated')
          : notify.error(action.error),
      ),
    ),
  { functional: true, dispatch: false },
);
