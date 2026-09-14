import { Injectable, computed, signal } from '@angular/core';
import { AccountInfo } from '@azure/msal-browser';

export type AuthProvider = 'microsoft' | 'local' | null;

/** Roles de la app (los mismos nombres que el backend). */
export type Role = 'ADMIN' | 'OPERADOR' | 'CLIENTE';

/** Precedencia para elegir un rol "por defecto" cuando el usuario tiene varios. */
const ROLE_ORDER: Role[] = ['ADMIN', 'OPERADOR', 'CLIENTE'];

const ACTIVE_ROLE_KEY = 'pedidos360.activeRole';

/**
 * Estado de sesion unificado. La app puede iniciar sesion con Microsoft
 * (MSAL, flujo redirect) o con el login de usuario/contraseña de ejemplo
 * (POST /api/auth/login). Los dos flujos terminan escribiendo su resultado
 * aca.
 *
 * Roles: el backend (GET /api/me) devuelve `roles[]` — los App Roles de Entra
 * asignados al usuario. Si el usuario tiene mas de uno, `activeRole` define
 * con cual esta actuando en la UI (selector "Actuar como" en el header). El
 * backend no distingue: el token trae todos y ADMIN ya puede con todo, asi
 * que el selector es solo de presentacion / navegacion.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly microsoftAccount = signal<AccountInfo | null>(null);
  private readonly microsoftIdToken = signal<string | null>(null);
  private readonly localUser = signal<{ name: string; idToken: string } | null>(null);

  /** Todos los roles del usuario (del token). */
  readonly roles = signal<Role[]>([]);
  /** Rol con el que se esta actuando (uno de `roles`). */
  readonly activeRole = signal<Role | null>(null);

  /** Rol efectivo para la UI y los guards. */
  readonly role = computed<Role | null>(() => this.activeRole() ?? this.highestRole());

  readonly canSwitchRoles = computed(() => this.roles().length > 1);

  readonly displayName = computed(
    () => this.microsoftAccount()?.name ?? this.localUser()?.name ?? null,
  );

  readonly isAdmin = computed(() => this.role() === 'ADMIN');
  /** Staff = puede gestionar inventario y estados de pedidos. */
  readonly isStaff = computed(() => this.role() === 'ADMIN' || this.role() === 'OPERADOR');
  readonly isCliente = computed(() => this.role() === 'CLIENTE');

  setMicrosoftSession(account: AccountInfo | null, idToken: string | null): void {
    this.microsoftAccount.set(account);
    this.microsoftIdToken.set(idToken);
  }

  setLocalSession(name: string | null, idToken: string | null): void {
    this.localUser.set(name && idToken ? { name, idToken } : null);
  }

  /** Carga los roles del backend y fija el rol activo (respeta la eleccion previa). */
  setRoles(roles: Role[]): void {
    const clean = ROLE_ORDER.filter((r) => roles.includes(r));
    this.roles.set(clean);
    const stored = this.readStoredRole();
    const next = stored && clean.includes(stored) ? stored : (clean[0] ?? null);
    this.activeRole.set(next);
  }

  /** Cambia el rol con el que se actua (solo si el usuario lo tiene). */
  actAs(role: Role): void {
    if (!this.roles().includes(role)) return;
    this.activeRole.set(role);
    try {
      sessionStorage.setItem(ACTIVE_ROLE_KEY, role);
    } catch {
      /* sessionStorage no disponible: seguimos igual */
    }
  }

  private highestRole(): Role | null {
    return ROLE_ORDER.find((r) => this.roles().includes(r)) ?? null;
  }

  private readStoredRole(): Role | null {
    try {
      const v = sessionStorage.getItem(ACTIVE_ROLE_KEY) as Role | null;
      return v && ROLE_ORDER.includes(v) ? v : null;
    } catch {
      return null;
    }
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
    this.roles.set([]);
    this.activeRole.set(null);
    try {
      sessionStorage.removeItem(ACTIVE_ROLE_KEY);
    } catch {
      /* nada */
    }
  }
}
