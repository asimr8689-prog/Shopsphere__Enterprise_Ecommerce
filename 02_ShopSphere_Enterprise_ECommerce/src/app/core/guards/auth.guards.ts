import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { selectIsAdmin, selectIsLoggedIn } from '@store/user/user.reducer';

/** Customer area: requires a (demo) session, otherwise redirect to login with a return URL. */
export const authGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return inject(Store)
    .select(selectIsLoggedIn)
    .pipe(
      take(1),
      map((loggedIn) =>
        loggedIn ? true : router.createUrlTree(['/account/login'], { queryParams: { returnUrl: state.url } }),
      ),
    );
};

/** Login/register pages: signed-in users are sent to their account instead. */
export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(Store)
    .select(selectIsLoggedIn)
    .pipe(
      take(1),
      map((loggedIn) => (loggedIn ? router.createUrlTree(['/account']) : true)),
    );
};

/** Admin area: canMatch so the lazy admin bundle is not even downloaded for non-admins. */
export const adminGuard: CanMatchFn = (_route, segments) => {
  const router = inject(Router);
  const notify = inject(NotificationService);
  const store = inject(Store);
  return store.select(selectIsAdmin).pipe(
    take(1),
    map((isAdmin) => {
      if (isAdmin) return true;
      notify.info('Please sign in with the demo admin account to open the dashboard.');
      const returnUrl = '/' + segments.map((s) => s.path).join('/');
      return router.createUrlTree(['/account/login'], { queryParams: { returnUrl, admin: 1 } });
    }),
  );
};
