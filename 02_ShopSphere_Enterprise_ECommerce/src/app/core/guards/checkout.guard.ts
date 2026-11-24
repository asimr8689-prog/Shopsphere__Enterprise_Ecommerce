import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { CartService } from '../services/cart.service';
import { NotificationService } from '../services/notification.service';

/** Checkout is only reachable with items in the cart. */
export const cartNotEmptyGuard: CanActivateFn = () => {
  const router = inject(Router);
  const notify = inject(NotificationService);
  return inject(CartService).isEmpty$.pipe(
    take(1),
    map((empty) => {
      if (!empty) return true;
      notify.info('Your cart is empty – add something before checking out.');
      return router.createUrlTree(['/cart']);
    }),
  );
};
