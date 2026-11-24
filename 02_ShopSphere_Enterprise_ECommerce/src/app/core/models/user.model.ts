export type UserRole = 'customer' | 'admin';

export interface Address {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface UserPreferences {
  newsletter: boolean;
  orderUpdates: boolean;
  smsAlerts: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  addresses: Address[];
  preferences: UserPreferences;
  createdAt: string;
}

/** Stored demo account record (includes a plain demo password – NOT production auth). */
export interface DemoAccount extends User {
  password: string;
}

export interface Session {
  user: User;
  /** Opaque demo token attached by the auth interceptor. Not a real JWT. */
  token: string;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  newsletter: boolean;
}

/** Countries offered in address forms (demo list). */
export const COUNTRIES = ['United States', 'Pakistan', 'United Kingdom', 'Canada', 'Germany', 'UAE', 'Australia'];
