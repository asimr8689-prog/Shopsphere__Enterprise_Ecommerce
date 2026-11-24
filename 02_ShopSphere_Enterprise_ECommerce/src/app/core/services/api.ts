import { HttpContextToken } from '@angular/common/http';
import { environment } from '@env/environment';

/** Builds a URL for the mock REST layer. Replace apiBaseUrl with a real API origin later. */
export function apiUrl(resource: string): string {
  return `${environment.apiBaseUrl}/${resource}.json`;
}

/** Set on a request to stop the error interceptor from showing a toast (the caller handles it). */
export const SILENT_ERRORS = new HttpContextToken<boolean>(() => false);

/** Normalised error shape produced by the error interceptor. */
export interface AppError {
  status: number;
  message: string;
  url?: string | null;
}

export function isAppError(value: unknown): value is AppError {
  return typeof value === 'object' && value !== null && 'status' in value && 'message' in value;
}

export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isAppError(err)) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}

/** Small helper to generate client-side ids for locally created records. */
export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
