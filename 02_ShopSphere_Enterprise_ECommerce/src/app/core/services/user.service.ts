import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, delay, map, of, switchMap, throwError } from 'rxjs';
import { Address, DemoAccount, LoginCredentials, RegisterPayload, Session, User } from '../models';
import { apiUrl, uid } from './api';
import { StorageService } from './storage.service';
import { AuthActions, ProfileActions } from '@store/user/user.actions';
import {
  selectAuthError,
  selectAuthStatus,
  selectCurrentUser,
  selectDefaultAddress,
  selectIsAdmin,
  selectIsLoggedIn,
} from '@store/user/user.reducer';

const ACCOUNTS_KEY = 'demo-accounts';

/**
 * DEMO AUTHENTICATION ONLY.
 * Accounts live in /data/users.json plus localStorage, passwords are compared in the browser and the
 * "token" is a random string. This exists to demonstrate UI flows, guards and interceptors.
 * Production needs a real identity provider (OAuth/OIDC), hashed passwords and HttpOnly cookies.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly store = inject(Store);

  // ---------- Facade (signals over NgRx) ----------
  readonly user = this.store.selectSignal(selectCurrentUser);
  readonly isLoggedIn = this.store.selectSignal(selectIsLoggedIn);
  readonly isAdmin = this.store.selectSignal(selectIsAdmin);
  readonly status = this.store.selectSignal(selectAuthStatus);
  readonly error = this.store.selectSignal(selectAuthError);
  readonly defaultAddress = this.store.selectSignal(selectDefaultAddress);
  readonly isLoggedIn$ = this.store.select(selectIsLoggedIn);
  readonly isAdmin$ = this.store.select(selectIsAdmin);

  /** Mock auth API call (used by the login effect). */
  login(credentials: LoginCredentials): Observable<Session> {
    return this.accounts().pipe(
      map((accounts) => accounts.find((a) => a.email.toLowerCase() === credentials.email.trim().toLowerCase())),
      switchMap((account) =>
        account && account.password === credentials.password
          ? of(this.createSession(account, credentials.remember ?? false))
          : throwError(() => new Error('Email or password is incorrect.')),
      ),
      delay(400),
    );
  }

  register(payload: RegisterPayload): Observable<Session> {
    return this.accounts().pipe(
      switchMap((accounts) => {
        if (accounts.some((a) => a.email.toLowerCase() === payload.email.toLowerCase())) {
          return throwError(() => new Error('An account with this email already exists.'));
        }
        const account: DemoAccount = {
          id: uid('u'),
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          email: payload.email.trim().toLowerCase(),
          password: payload.password,
          phone: payload.phone,
          role: 'customer',
          addresses: [],
          preferences: { newsletter: payload.newsletter, orderUpdates: true, smsAlerts: false },
          createdAt: new Date().toISOString(),
        };
        this.saveLocalAccount(account);
        return of(this.createSession(account, true));
      }),
      delay(500),
    );
  }

  updateUser(userId: string, changes: Partial<User>): Observable<User> {
    return this.accounts().pipe(
      switchMap((accounts) => {
        const account = accounts.find((a) => a.id === userId);
        if (!account) return throwError(() => new Error('Account not found.'));
        if (
          changes.email &&
          accounts.some((a) => a.id !== userId && a.email.toLowerCase() === changes.email!.toLowerCase())
        ) {
          return throwError(() => new Error('That email is already used by another account.'));
        }
        const updated: DemoAccount = { ...account, ...changes, id: account.id, role: account.role };
        this.saveLocalAccount(updated);
        return of(stripPassword(updated));
      }),
      delay(300),
    );
  }

  changePassword(userId: string, current: string, next: string): Observable<void> {
    return this.accounts().pipe(
      switchMap((accounts) => {
        const account = accounts.find((a) => a.id === userId);
        if (!account || account.password !== current) {
          return throwError(() => new Error('Current password is incorrect.'));
        }
        this.saveLocalAccount({ ...account, password: next });
        return of(undefined);
      }),
      delay(300),
    );
  }

  // ---------- Facade commands ----------
  signIn(credentials: LoginCredentials, returnUrl?: string): void {
    this.store.dispatch(AuthActions.login({ credentials, returnUrl }));
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  registerAndSignIn(payload: RegisterPayload, returnUrl?: string): void {
    this.store.dispatch(AuthActions.register({ payload, returnUrl }));
  }

  clearError(): void {
    this.store.dispatch(AuthActions.clearError());
  }

  updateProfile(changes: Partial<User>, successMessage?: string): void {
    this.store.dispatch(ProfileActions.updateProfile({ changes, successMessage }));
  }

  saveAddress(address: Address): void {
    const current = this.user()?.addresses ?? [];
    const exists = current.some((a) => a.id === address.id);
    let addresses = exists ? current.map((a) => (a.id === address.id ? address : a)) : [...current, address];
    if (address.isDefault || addresses.length === 1) {
      addresses = addresses.map((a) => ({ ...a, isDefault: a.id === address.id }));
    }
    this.updateProfile({ addresses }, exists ? 'Address updated' : 'Address added');
  }

  deleteAddress(addressId: string): void {
    let addresses = (this.user()?.addresses ?? []).filter((a) => a.id !== addressId);
    if (addresses.length && !addresses.some((a) => a.isDefault)) {
      addresses = addresses.map((a, i) => ({ ...a, isDefault: i === 0 }));
    }
    this.updateProfile({ addresses }, 'Address removed');
  }

  setDefaultAddress(addressId: string): void {
    const addresses = (this.user()?.addresses ?? []).map((a) => ({ ...a, isDefault: a.id === addressId }));
    this.updateProfile({ addresses }, 'Default address updated');
  }

  // ---------- Internals ----------
  /** Seed accounts from JSON merged with locally registered/edited accounts (local wins). */
  private accounts(): Observable<DemoAccount[]> {
    return this.http.get<DemoAccount[]>(apiUrl('users')).pipe(
      map((seed) => {
        const local = this.storage.get<DemoAccount[]>(ACCOUNTS_KEY, []);
        const merged = seed.map((s) => local.find((l) => l.id === s.id) ?? s);
        return [...merged, ...local.filter((l) => !seed.some((s) => s.id === l.id))];
      }),
    );
  }

  private saveLocalAccount(account: DemoAccount): void {
    const local = this.storage.get<DemoAccount[]>(ACCOUNTS_KEY, []);
    const next = local.some((a) => a.id === account.id)
      ? local.map((a) => (a.id === account.id ? account : a))
      : [...local, account];
    this.storage.set(ACCOUNTS_KEY, next);
  }

  private createSession(account: DemoAccount, remember: boolean): Session {
    const ttl = remember ? 30 * 24 * 3600_000 : 24 * 3600_000;
    return {
      user: stripPassword(account),
      token: `demo.${btoa(account.id)}.${Math.random().toString(36).slice(2)}`,
      expiresAt: new Date(Date.now() + ttl).toISOString(),
    };
  }
}

function stripPassword(account: DemoAccount): User {
  const { password: _password, ...user } = account;
  return user;
}
