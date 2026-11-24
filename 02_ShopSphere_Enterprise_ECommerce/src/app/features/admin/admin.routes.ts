import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';

/** Lazy admin area – protected by adminGuard (canMatch) in app.routes.ts. */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard – ShopSphere Admin',
        loadComponent: () => import('./dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'products',
        title: 'Products – ShopSphere Admin',
        loadComponent: () => import('./products-admin.page').then((m) => m.ProductsAdminPage),
      },
      {
        path: 'categories',
        title: 'Categories – ShopSphere Admin',
        loadComponent: () => import('./categories-admin.page').then((m) => m.CategoriesAdminPage),
      },
      {
        path: 'orders',
        title: 'Orders – ShopSphere Admin',
        loadComponent: () => import('./orders-admin.page').then((m) => m.OrdersAdminPage),
      },
      {
        path: 'inventory',
        title: 'Inventory – ShopSphere Admin',
        loadComponent: () => import('./inventory.page').then((m) => m.InventoryPage),
      },
    ],
  },
];
