import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from './auth/auth.service';
import { msalLoginRequest } from './auth/microsoft/microsoft-auth.config';
import { ConsentModal } from './consent/consent-modal';
import { NotificationBell } from './notifications/notification-bell';
import { UserMenu } from './user/user-menu';
import { UserService } from './user/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, UserMenu, NotificationBell, ConsentModal],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private msal = inject(MsalService);
  private authSvc = inject(AuthService);
  private users = inject(UserService);
  private router = inject(Router);

  get isAuthenticated(): boolean {
    return this.authSvc.isAuthenticated;
  }

  get displayName(): string | null {
    return this.authSvc.displayName();
  }

  get auth(): AuthService {
    return this.authSvc;
  }

  /** Logo del header: a donde volver segun el rol (OPERADOR no tiene /home). */
  get landingRoute(): string {
    return this.authSvc.isOperador() ? '/kitchen' : '/home';
  }

  /** `null` = perfil todavia no cargado: no mostrar el modal hasta saber de verdad. */
  get showConsentModal(): boolean {
    return this.authSvc.consentGiven() === false;
  }

  /**
   * Pide un token nuevo a Azure (forceRefresh) y recarga el perfil desde
   * /api/me — el rol es fijo por email en el backend, así que esto sirve para
   * tomar un cambio de esa config sin cerrar sesión.
   */
  refreshPermissions(): void {
    const account =
      this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0];
    if (!account) return;
    this.msal
      .acquireTokenSilent({ account, scopes: msalLoginRequest.scopes, forceRefresh: true })
      .subscribe({
        next: (result) => {
          this.authSvc.setMicrosoftSession(account, result.idToken);
          this.users.ensureLoaded(true);
        },
        error: (err) => console.error('refresh token', err),
      });
  }

  ngOnInit(): void {
    // Completa el flujo de redirect de Microsoft. Emite el resultado cuando
    // volvemos desde Azure (/auth/callback); emite null en cargas normales.
    this.msal.handleRedirectObservable().subscribe({
      next: (result) => {
        if (result?.account) {
          this.msal.instance.setActiveAccount(result.account);
          this.authSvc.setMicrosoftSession(result.account, result.idToken);
          this.users.ensureLoaded(true);
          this.router.navigateByUrl('/home');
        } else {
          this.restoreMicrosoftSession();
        }
      },
      error: (err) => console.error('MSAL redirect', err),
    });
  }

  /** Al recargar la pagina MSAL ya tiene la cuenta en sessionStorage; recuperamos el idToken de su cache. */
  private restoreMicrosoftSession(): void {
    const account = this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0];
    if (!account) return;
    this.msal.instance.setActiveAccount(account);
    this.msal.acquireTokenSilent({ account, scopes: msalLoginRequest.scopes }).subscribe({
      next: (result) => {
        this.authSvc.setMicrosoftSession(account, result.idToken);
        this.users.ensureLoaded(true);
      },
      error: () => this.authSvc.setMicrosoftSession(null, null),
    });
  }

  logout(): void {
    this.authSvc.clear();
    this.users.clear();
    this.msal.logoutRedirect();
  }
}
