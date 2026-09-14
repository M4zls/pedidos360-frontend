import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, Role } from './auth.service';
import { UserService } from '../user/user.service';

/**
 * Guard por rol. Se asegura de tener el perfil (/api/me) cargado y despues
 * deja pasar solo si el rol esta permitido; si no, manda a /home.
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
  return router.parseUrl('/home');
};
