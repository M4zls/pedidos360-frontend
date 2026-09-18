import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, Role } from './auth.service';
import { UserService } from '../user/user.service';

/** A donde mandar a cada rol cuando no tiene acceso a la ruta pedida. */
const FALLBACK_ROUTE: Record<Role, string> = {
  ADMIN: '/home',
  // OPERADOR (cocina) no tiene acceso a /home ni /orders: su aterrizaje es /kitchen.
  OPERADOR: '/kitchen',
  CLIENTE: '/home',
};

/**
 * Guard por rol. Se asegura de tener el perfil (/api/me) cargado y despues
 * deja pasar solo si el rol esta permitido; si no, manda al aterrizaje propio
 * de ese rol (ver FALLBACK_ROUTE) para no generar un loop de redirects.
 *
 *   { path: 'inventory', canActivate: [authGuard, roleGuard('ADMIN', 'OPERADOR')] }
 */
export const roleGuard = (...allowed: Role[]) => async () => {
  const auth = inject(AuthService);
  const users = inject(UserService);
  const router = inject(Router);

  if (auth.role() === null) {
    await users.ensureLoaded();
  }
  const role = auth.role();
  if (role !== null && allowed.includes(role)) {
    return true;
  }
  return router.parseUrl(role ? FALLBACK_ROUTE[role] : '/home');
};
