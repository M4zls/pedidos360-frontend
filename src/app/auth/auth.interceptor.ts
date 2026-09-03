import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Agrega `Authorization: Bearer <idToken>` a las llamadas al backend
 * (rutas relativas que empiezan con /api/). Asi cada servicio deja de armar
 * el header a mano.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).idToken;
  const isApiCall = req.url.startsWith('/api/');

  if (token && isApiCall && !req.headers.has('Authorization')) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
