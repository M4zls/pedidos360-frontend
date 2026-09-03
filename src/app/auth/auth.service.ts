import { Injectable, computed, signal } from '@angular/core';
import { AccountInfo } from '@azure/msal-browser';

export type AuthProvider = 'microsoft' | 'local' | null;

/**
 * Estado de sesion unificado. La app puede iniciar sesion con Microsoft
 * (MSAL, flujo redirect) o con el login de usuario/contraseña de ejemplo
 * (POST /api/auth/login). Los dos flujos terminan escribiendo su resultado
 * aca, y el resto de la app (guard, dashboard, llamadas al backend) usa
 * `idToken` / `provider` sin importarle con cual se logueo el usuario.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Sesion con Microsoft: la cuenta y el idToken JWT (este ultimo se guarda
  // aparte porque AccountInfo de MSAL no expone el JWT crudo).
  private readonly microsoftAccount = signal<AccountInfo | null>(null);
  private readonly microsoftIdToken = signal<string | null>(null);

  // Sesion con el login de usuario/contraseña de ejemplo (token propio,
  // emitido por el backend).
  private readonly localUser = signal<{ name: string; idToken: string } | null>(null);

  /** Nombre a mostrar en la UI, o null si no hay sesion. */
  readonly displayName = computed(
    () => this.microsoftAccount()?.name ?? this.localUser()?.name ?? null,
  );

  setMicrosoftSession(account: AccountInfo | null, idToken: string | null): void {
    this.microsoftAccount.set(account);
    this.microsoftIdToken.set(idToken);
  }

  setLocalSession(name: string | null, idToken: string | null): void {
    this.localUser.set(name && idToken ? { name, idToken } : null);
  }

  get provider(): AuthProvider {
    if (this.microsoftAccount()) return 'microsoft';
    if (this.localUser()) return 'local';
    return null;
  }

  get idToken(): string | null {
    return this.microsoftIdToken() ?? this.localUser()?.idToken ?? null;
  }

  get isAuthenticated(): boolean {
    return this.idToken !== null;
  }

  clear(): void {
    this.setMicrosoftSession(null, null);
    this.setLocalSession(null, null);
  }
}
