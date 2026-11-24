import { HttpInterceptorFn } from '@angular/common/http';
import { delay } from 'rxjs';
import { environment } from '@env/environment';

/**
 * Adds client headers to API calls and (in development) simulates network latency
 * for the mock JSON API so loading states are visible.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const isApi = req.url.startsWith(environment.apiBaseUrl);
  if (!isApi) return next(req);

  const apiReq = req.clone({ setHeaders: { 'X-Client': 'shopsphere-web', Accept: 'application/json' } });
  return environment.mockLatencyMs > 0 ? next(apiReq).pipe(delay(environment.mockLatencyMs)) : next(apiReq);
};
