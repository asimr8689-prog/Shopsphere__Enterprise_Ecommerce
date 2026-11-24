import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards/auth.guards';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: 'login',
    title: 'Sign in – ShopSphere',
    canActivate: [guestGuard],
    loadComponent: () => import('./login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    title: 'Create account – ShopSphere',
    canActivate: [guestGuard],
    loadComponent: () => import('./register.page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./account-layout.component').then((m) => m.AccountLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profile' },
      {
        path: 'profile',
        title: 'My profile – ShopSphere',
        loadComponent: () => import('./profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'orders',
        title: 'My orders – ShopSphere',
        loadComponent: () => import('../orders/orders-list.page').then((m) => m.OrdersListPage),
      },
      {
        path: 'orders/:orderId',
        title: 'Order details – ShopSphere',
        loadComponent: () => import('../orders/order-detail.page').then((m) => m.OrderDetailPage),
      },
      {
        path: 'addresses',
        title: 'Addresses – ShopSphere',
        loadComponent: () => import('./addresses.page').then((m) => m.AddressesPage),
      },
      {
        path: 'settings',
        title: 'Account settings – ShopSphere',
        loadComponent: () => import('./settings.page').then((m) => m.SettingsPage),
      },
    ],
  },
];
