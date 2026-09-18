import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { Home } from './home/home';
import { InventoryPage } from './inventory/inventory-page';
import { OrdersPage } from './orders/orders-page';
import { KitchenPage } from './kitchen/kitchen-page';
import { DispatchPage } from './dispatch/dispatch-page';
import { SalesPage } from './sales/sales-page';
import { AuthCallback } from './auth/callback/auth-callback';
import { authGuard } from './auth/auth.guard';
import { roleGuard } from './auth/role.guard';

export const routes: Routes = [
  { path: '', component: Login },
  // Redirect URI de Microsoft: MSAL procesa el hash aca y App navega al panel.
  { path: 'auth/callback', component: AuthCallback },

  // Catalogo (armar pedido) y "mis pedidos": CLIENTE y ADMIN. OPERADOR
  // (cocina) no arma pedidos, solo los ve filtrados en /kitchen.
  { path: 'home', component: Home, canActivate: [authGuard, roleGuard('ADMIN', 'CLIENTE')] },
  { path: 'orders', component: OrdersPage, canActivate: [authGuard, roleGuard('ADMIN', 'CLIENTE')] },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },

  // Solo staff.
  {
    path: 'inventory',
    component: InventoryPage,
    canActivate: [authGuard, roleGuard('ADMIN', 'OPERADOR')],
  },
  {
    path: 'kitchen',
    component: KitchenPage,
    canActivate: [authGuard, roleGuard('ADMIN', 'OPERADOR')],
  },
  {
    path: 'dispatch',
    component: DispatchPage,
    canActivate: [authGuard, roleGuard('ADMIN', 'OPERADOR')],
  },
  // Solo admin.
  {
    path: 'sales',
    component: SalesPage,
    canActivate: [authGuard, roleGuard('ADMIN')],
  },

  { path: '**', redirectTo: '' },
];
