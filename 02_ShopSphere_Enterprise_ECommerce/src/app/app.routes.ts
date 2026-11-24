import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/auth.guards';
import { cartNotEmptyGuard } from './core/guards/checkout.guard';
import { ShellLayout } from './layout/shell/shell.layout';

/**
 * Every feature page is lazy loaded (loadComponent / loadChildren) so the initial bundle
 * only contains the shell, store and shared services.
 */
export const routes: Routes = [
  {
    path: '',
    component: ShellLayout,
    children: [
      {
        path: '',
        title: 'ShopSphere – Shop electronics, footwear & home',
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'products',
        title: 'Shop all products – ShopSphere',
        loadComponent: () => import('./features/products/products.page').then((m) => m.ProductsPage),
      },
      {
        path: 'products/:slug',
        title: 'Product – ShopSphere',
        loadComponent: () =>
          import('./features/product-details/product-details.page').then((m) => m.ProductDetailsPage),
      },
      {
        path: 'cart',
        title: 'Your cart – ShopSphere',
        loadComponent: () => import('./features/cart/cart.page').then((m) => m.CartPage),
      },
      {
        path: 'wishlist',
        title: 'Wishlist – ShopSphere',
        loadComponent: () => import('./features/wishlist/wishlist.page').then((m) => m.WishlistPage),
      },
      {
        path: 'checkout',
        title: 'Checkout – ShopSphere',
        canActivate: [cartNotEmptyGuard],
        loadComponent: () => import('./features/checkout/checkout.page').then((m) => m.CheckoutPage),
      },
      {
        path: 'checkout/confirmation/:orderId',
        title: 'Order confirmed – ShopSphere',
        loadComponent: () =>
          import('./features/checkout/order-confirmation.page').then((m) => m.OrderConfirmationPage),
      },
      {
        path: 'account',
        loadChildren: () => import('./features/account/account.routes').then((m) => m.ACCOUNT_ROUTES),
      },
      {
        path: 'orders',
        redirectTo: 'account/orders',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'admin',
    canMatch: [adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: '**',
    component: ShellLayout,
    children: [
      {
        path: '',
        title: 'Page not found – ShopSphere',
        loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
