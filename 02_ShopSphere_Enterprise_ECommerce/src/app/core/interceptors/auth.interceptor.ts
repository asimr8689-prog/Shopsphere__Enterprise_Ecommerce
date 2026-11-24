import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { environment } from '@env/environment';
import { selectToken } from '@store/user/user.reducer';

/**
 * Attaches the (demo) session token to API requests.
 * With a real backend this would typically be an HttpOnly cookie instead of a header.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) return next(req);
  const token = inject(Store).selectSignal(selectToken)();
  return token ? next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })) : next(req);
};
