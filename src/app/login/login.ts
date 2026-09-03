import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from '../auth/auth.service';
import { msalLoginRequest } from '../auth/microsoft/microsoft-auth.config';

interface LoginResponse {
  token: string;
}

/**
 * Pantalla de inicio de sesion (ruta '', a pantalla completa, fuera del
 * layout con header). Dos opciones:
 *  - Microsoft (MSAL, flujo redirect).
 *  - Usuario/contraseña de ejemplo contra POST /api/auth/login.
 */
@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private msal = inject(MsalService);
  private router = inject(Router);

  username = '';
  password = '';
  error: string | null = null;
  loading = false;

  ngOnInit(): void {
    if (this.auth.isAuthenticated) {
      this.router.navigateByUrl('/dashboard');
    }
  }

  loginMicrosoft(): void {
    this.msal.loginRedirect(msalLoginRequest);
  }

  login(): void {
    this.error = null;
    this.loading = true;
    this.http
      .post<LoginResponse>('http://localhost:8080/api/auth/login', {
        username: this.username,
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          this.auth.setLocalSession(this.username, res.token);
          this.loading = false;
          this.router.navigateByUrl('/dashboard');
        },
        error: () => {
          this.error = 'Usuario o contraseña incorrectos.';
          this.loading = false;
        },
      });
  }
}
