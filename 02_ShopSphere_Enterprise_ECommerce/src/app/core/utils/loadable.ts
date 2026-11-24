import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { errorMessage } from '../services/api';

export type Loadable<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: string };

export const LOADING = { status: 'loading', data: null, error: null } as const;

/** Wraps an observable into loading → success | error states. */
export function toLoadable<T>(source: Observable<T>): Observable<Loadable<T>> {
  return source.pipe(
    map((data): Loadable<T> => ({ status: 'success', data, error: null })),
    startWith<Loadable<T>>(LOADING),
    catchError((err) => of<Loadable<T>>({ status: 'error', data: null, error: errorMessage(err) })),
  );
}

/**
 * Signal-based async resource with a retry() trigger. Must be called in an injection context
 * (field initialiser / constructor). Used by pages to render loading, error and empty states.
 */
export function loadableSignal<T>(factory: () => Observable<T>): { state: Signal<Loadable<T>>; retry: () => void } {
  const retry$ = new Subject<void>();
  const state = toSignal(
    retry$.pipe(
      startWith(undefined),
      switchMap(() => toLoadable(factory())),
    ),
    { initialValue: LOADING as Loadable<T> },
  );
  return { state, retry: () => retry$.next() };
}
