import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';

/** Cada cuanto se reintenta /api/me mientras el gateway arranca. */
const AUTO_RETRY_MS = 5000;
/** Tope de reintentos automaticos (~5 min); despues queda el boton. */
const AUTO_RETRY_MAX = 60;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit, OnDestroy {
  protected readonly users = inject(UserService);
  private auth = inject(AuthService);
  private router = inject(Router);

  protected readonly autoRetries = signal(0);
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  async ngOnInit(): Promise<void> {
    const profile = await this.users.ensureLoaded();
    if (!profile) {
      this.scheduleAutoRetry();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  /**
   * roleGuard manda aca cuando /api/me falla. Si al reintentar ya hay
   * perfil, vuelve al aterrizaje del rol (OPERADOR no tiene /home).
   */
  async retry(): Promise<boolean> {
    const profile = await this.users.ensureLoaded(true);
    if (profile) {
      this.router.navigateByUrl(this.auth.isOperador() ? '/kitchen' : '/home');
    }
    return profile !== null;
  }

  /**
   * Si el fallo fue porque WSO2 todavia esta arrancando, reintenta solo
   * hasta que conteste: el usuario no tiene que apretar nada.
   */
  private scheduleAutoRetry(): void {
    if (this.destroyed || !this.users.gatewayStarting() || this.autoRetries() >= AUTO_RETRY_MAX) {
      return;
    }
    this.retryTimer = setTimeout(async () => {
      this.autoRetries.update((n) => n + 1);
      if (!(await this.retry())) {
        this.scheduleAutoRetry();
      }
    }, AUTO_RETRY_MS);
  }
}
