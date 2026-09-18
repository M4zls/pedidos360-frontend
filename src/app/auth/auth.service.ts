import { Injectable, computed, signal } from '@angular/core';
import { AccountInfo } from '@azure/msal-browser';

export type AuthProvider = 'microsoft' | null;

/** Roles de la app (los mismos nombres que el backend). */
export type Role = 'ADMIN' | 'OPERADOR' | 'CLIENTE';

/**
 * Estado de sesion unificado. Unico login: Microsoft (MSAL, flujo redirect).
 *
 * Roles: el backend (GET /api/me) devuelve `roles[]`, pero cada cuenta tiene
 * SIEMPRE uno solo — es fijo por email (ver `app.roles` en el backend). No
 * hay forma de tener ni de elegir mas de uno desde acá.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly microsoftAccount = signal<AccountInfo | null>(null);
  private readonly microsoftIdToken = signal<string | null>(null);

  /** Rol del usuario (del token). */
  readonly roles = signal<Role[]>([]);
  /**
   * Si el usuario ya acepto guardar sus datos (proteccion de datos). `null`
   * mientras no se cargo el perfil todavia: no hay que mostrar el modal hasta
   * saber de verdad si falta o no.
   */
  readonly consentGiven = signal<boolean | null>(null);

  /** Rol efectivo para la UI y los guards. */
  readonly role = computed<Role | null>(() => this.roles()[0] ?? null);

  readonly displayName = computed(() => this.microsoftAccount()?.name ?? null);

  readonly isAdmin = computed(() => this.role() === 'ADMIN');
  /** Staff = puede gestionar inventario y estados de pedidos. */
  readonly isStaff = computed(() => this.role() === 'ADMIN' || this.role() === 'OPERADOR');
  readonly isCliente = computed(() => this.role() === 'CLIENTE');
  /** OPERADOR = staff de cocina: ve /kitchen, /dispatch e /inventory, pero no arma ni gestiona pedidos en general. */
  readonly isOperador = computed(() => this.role() === 'OPERADOR');

  setMicrosoftSession(account: AccountInfo | null, idToken: string | null): void {
    this.microsoftAccount.set(account);
    this.microsoftIdToken.set(idToken);
  }

  setRoles(roles: Role[]): void {
    this.roles.set(roles);
  }

  get provider(): AuthProvider {
    return this.microsoftAccount() ? 'microsoft' : null;
  }

  get idToken(): string | null {
    return this.microsoftIdToken();
  }

  get isAuthenticated(): boolean {
    return this.idToken !== null;
  }

  clear(): void {
    this.setMicrosoftSession(null, null);
    this.roles.set([]);
    this.consentGiven.set(null);
  }
}
