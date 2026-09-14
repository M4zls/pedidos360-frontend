import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Home } from './home/home';
import { InventoryPage } from './inventory/inventory-page';
import { OrdersPage } from './orders/orders-page';
import { UsersPage } from './admin/users-page';
import { AuthCallback } from './auth/callback/auth-callback';
import { authGuard } from './auth/auth.guard';
import { roleGuard } from './auth/role.guard';

export const routes: Routes = [
  { path: '', component: Login },
  // Redirect URI de Microsoft: MSAL procesa el hash aca y App navega al panel.
  { path: 'auth/callback', component: AuthCallback },

  // Aterrizaje despues del login: catalogo de productos.
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'orders', component: OrdersPage, canActivate: [authGuard] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },

  // Solo staff.
  {
    path: 'inventory',
    component: InventoryPage,
    canActivate: [authGuard, roleGuard('ADMIN', 'OPERADOR')],
  },
  // Solo admin.
  {
    path: 'admin/users',
    component: UsersPage,
    canActivate: [authGuard, roleGuard('ADMIN')],
  },

  { path: '**', redirectTo: '' },
];
