import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from './auth/auth.service';
import { msalLoginRequest } from './auth/microsoft/microsoft-auth.config';
import { UserMenu } from './user/user-menu';
import { UserService } from './user/user.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, UserMenu],
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

  ngOnInit(): void {
    // Completa el flujo de redirect de Microsoft. Emite el resultado cuando
    // volvemos desde Azure (/auth/callback); emite null en cargas normales.
    this.msal.handleRedirectObservable().subscribe({
      next: (result) => {
        if (result?.account) {
          this.msal.instance.setActiveAccount(result.account);
          this.authSvc.setMicrosoftSession(result.account, result.idToken);
          this.router.navigateByUrl('/dashboard');
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
      next: (result) => this.authSvc.setMicrosoftSession(account, result.idToken),
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
