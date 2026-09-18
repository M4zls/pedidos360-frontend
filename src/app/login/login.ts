import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from '../auth/auth.service';
import { msalLoginRequest } from '../auth/microsoft/microsoft-auth.config';

/**
 * Pantalla de inicio de sesion (ruta '', a pantalla completa, fuera del
 * layout con header). Unico login: Microsoft (MSAL, flujo redirect).
 */
@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private auth = inject(AuthService);
  private msal = inject(MsalService);
  private router = inject(Router);

  ngOnInit(): void {
    if (this.auth.isAuthenticated) {
      this.router.navigateByUrl('/home');
    }
  }

  loginMicrosoft(): void {
    this.msal.loginRedirect(msalLoginRequest);
  }
}
