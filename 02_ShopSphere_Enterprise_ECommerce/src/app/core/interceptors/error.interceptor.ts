import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { retry, throwError, timer, catchError } from 'rxjs';
import { AppError, SILENT_ERRORS } from '../services/api';
import { NotificationService } from '../services/notification.service';

const RETRYABLE = new Set([0, 408, 429, 500, 502, 503, 504]);

/**
 * - Retries idempotent GET requests on network/5xx errors with linear back-off (2 retries).
 * - Converts HttpErrorResponse into a friendly AppError.
 * - Shows a toast unless the request opted out with the SILENT_ERRORS context token.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    retry({
      count: req.method === 'GET' ? 2 : 0,
      delay: (error: unknown, attempt: number) =>
        error instanceof HttpErrorResponse && RETRYABLE.has(error.status) ? timer(attempt * 500) : throwError(() => error),
    }),
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
      const appError: AppError = { status: error.status, message: friendlyMessage(error), url: error.url };
      if (!req.context.get(SILENT_ERRORS)) notify.error(appError.message);
      return throwError(() => appError);
    }),
  );
};

function friendlyMessage(error: HttpErrorResponse): string {
  switch (true) {
    case error.status === 0:
      return 'Unable to reach the server. Check your connection and try again.';
    case error.status === 401:
      return 'Your session has expired. Please sign in again.';
    case error.status === 403:
      return 'You do not have permission to do that.';
    case error.status === 404:
      return 'The requested resource could not be found.';
    case error.status >= 500:
      return 'Our servers are having trouble right now. Please try again shortly.';
    default:
      return error.error?.message ?? 'Something went wrong. Please try again.';
  }
}
