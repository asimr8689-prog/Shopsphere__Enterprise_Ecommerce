import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, delay, of, shareReplay } from 'rxjs';
import { Testimonial } from '../models';
import { apiUrl } from './api';
import { StorageService } from './storage.service';

/** Marketing content for the storefront (testimonials, newsletter). */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);

  /** Testimonials are non-critical: fall back to an empty list instead of an error. */
  readonly testimonials$: Observable<Testimonial[]> = this.http
    .get<Testimonial[]>(apiUrl('testimonials'))
    .pipe(catchError(() => of([])), shareReplay(1));

  /** Mock newsletter subscription – stored locally; a real ESP integration needs a backend. */
  subscribe(email: string): Observable<{ email: string }> {
    const list = this.storage.get<string[]>('newsletter', []);
    if (!list.includes(email)) this.storage.set('newsletter', [...list, email]);
    return of({ email }).pipe(delay(500));
  }
}
