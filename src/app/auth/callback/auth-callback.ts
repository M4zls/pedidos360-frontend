import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * Pantalla de aterrizaje de la Redirect URI de Microsoft
 * (http://localhost:4200/auth/callback).
 *
 * En el flujo de redirect, `App` procesa la respuesta con
 * `handleRedirectObservable()` y navega al panel. Este componente solo
 * muestra un loader mientras tanto y actua de red de seguridad si la
 * navegacion no ocurre.
 */
@Component({
  selector: 'app-auth-callback',
  imports: [],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-500 via-orange-800 to-neutral-950">
      <div class="flex flex-col items-center gap-4 text-white">
        <span class="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"></span>
        <p class="text-sm text-white/80">Completando inicio de sesión…</p>
      </div>
    </div>
  `,
})
export class AuthCallback implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit(): void {
    setTimeout(() => {
      this.router.navigateByUrl(this.auth.isAuthenticated ? '/home' : '/');
    }, 2500);
  }
}
