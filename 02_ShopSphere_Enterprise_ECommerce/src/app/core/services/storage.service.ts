import { Injectable } from '@angular/core';

const PREFIX = 'shopsphere:';

/**
 * Safe wrapper around localStorage. Every read/write is guarded because storage can be
 * unavailable (private mode, quota exceeded, disabled cookies) and must never crash the app.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string, fallback: T): T {
    return readStorage(key, fallback);
  }

  set<T>(key: string, value: T): void {
    writeStorage(key, value);
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      /* storage unavailable – ignore */
    }
  }

  /** Removes every ShopSphere key (used by "Reset demo data" in settings). */
  clearAll(): void {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  }
}

/** Plain functions so NgRx meta-reducers (which cannot use DI) can share the same logic. */
export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* quota exceeded or unavailable – ignore */
  }
}
