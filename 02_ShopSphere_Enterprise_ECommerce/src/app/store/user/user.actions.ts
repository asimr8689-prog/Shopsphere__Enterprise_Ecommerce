import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { LoginCredentials, RegisterPayload, Session, User } from '@core/models';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Login: props<{ credentials: LoginCredentials; returnUrl?: string }>(),
    'Login Success': props<{ session: Session; returnUrl?: string }>(),
    'Login Failure': props<{ error: string }>(),
    Register: props<{ payload: RegisterPayload; returnUrl?: string }>(),
    'Register Success': props<{ session: Session; returnUrl?: string }>(),
    'Register Failure': props<{ error: string }>(),
    Logout: emptyProps(),
    'Session Expired': emptyProps(),
    'Clear Error': emptyProps(),
  },
});

export const ProfileActions = createActionGroup({
  source: 'Profile',
  events: {
    'Update Profile': props<{ changes: Partial<Omit<User, 'id' | 'role' | 'createdAt'>>; successMessage?: string }>(),
    'Update Profile Success': props<{ user: User; successMessage?: string }>(),
    'Update Profile Failure': props<{ error: string }>(),
  },
});
