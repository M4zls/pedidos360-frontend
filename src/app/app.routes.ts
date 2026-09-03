import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { AuthCallback } from './auth/callback/auth-callback';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', component: Login },
  // Redirect URI de Microsoft: MSAL procesa el hash aca y App navega al panel.
  { path: 'auth/callback', component: AuthCallback },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
