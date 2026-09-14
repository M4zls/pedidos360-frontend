import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AuthService, Role } from './auth/auth.service';
import { msalLoginRequest } from './auth/microsoft/microsoft-auth.config';
import { UserMenu } from './user/user-menu';
import { UserService } from './user/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, UserMenu],
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

  /** Selector "Actuar como": cambia el rol activo y vuelve al inicio para que
   *  los guards re-evaluen la ruta actual con el nuevo rol. */
  actAs(role: Role): void {
    this.authSvc.actAs(role);
    this.router.navigateByUrl('/home');
  }

  /**
   * Pide un token nuevo a Azure ignorando la cache (forceRefresh) para tomar
   * cambios de App Roles sin cerrar sesion, y recarga el perfil. Para el login
   * local solo recarga /api/me.
   */
  refreshPermissions(): void {
    const account =
      this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0];
    if (this.authSvc.provider === 'microsoft' && account) {
      this.msal
        .acquireTokenSilent({ account, scopes: msalLoginRequest.scopes, forceRefresh: true })
        .subscribe({
          next: (result) => {
            this.authSvc.setMicrosoftSession(account, result.idToken);
            this.users.ensureLoaded(true);
          },
          error: (err) => console.error('refresh token', err),
        });
    } else {
      this.users.ensureLoaded(true);
    }
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
    const wasMicrosoft = this.authSvc.provider === 'microsoft';
    this.authSvc.clear();
    this.users.clear();
    if (wasMicrosoft) {
      this.msal.logoutRedirect();
    } else {
      this.router.navigateByUrl('/');
    }
  }
}
