import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService, Role } from '../auth/auth.service';

/** Datos del usuario autenticado que devuelve GET /api/me (Microsoft o local). */
export interface UserProfile {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  provider?: 'microsoft' | 'local';
  /** App Roles de Entra asignados (o el rol por email si el token no los trae). */
  roles?: Role[];
}

const PROVIDER_LABELS: Record<string, string> = {
  microsoft: 'Microsoft',
  local: 'usuario y contraseña',
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  OPERADOR: 'Operador',
  CLIENTE: 'Cliente',
};

/**
 * Carga y cachea el perfil del usuario logueado. Lo consumen el menu de
 * perfil del header, el panel y los guards por rol, sin que cada uno haga su
 * propia llamada. Ademas copia el rol al AuthService.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private inFlight: Promise<UserProfile | null> | null = null;

  /** Iniciales para el avatar (no hay foto en los tokens de Microsoft ni local). */
  readonly initials = computed(() => {
    const name = this.profile()?.name ?? this.auth.displayName() ?? '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const first = parts[0][0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  });

  providerLabel(provider?: string): string {
    return PROVIDER_LABELS[provider ?? ''] ?? '—';
  }

  roleLabel(role?: Role): string {
    return role ? ROLE_LABELS[role] : '—';
  }

  /** Trae el perfil desde el backend. No repite la llamada si ya esta cargado (salvo force). */
  load(force = false): void {
    void this.ensureLoaded(force);
  }

  /**
   * Igual que load() pero devuelve una promesa que resuelve con el perfil.
   * La usan los guards por rol para decidir con el rol ya disponible.
   */
  ensureLoaded(force = false): Promise<UserProfile | null> {
    if (!force && this.profile()) return Promise.resolve(this.profile());
    if (this.inFlight) return this.inFlight;

    const token = this.auth.idToken;
    if (!token) {
      this.error.set('No hay sesión activa.');
      return Promise.resolve(null);
    }

    this.loading.set(true);
    this.error.set(null);
    // El Bearer lo agrega authInterceptor.
    this.inFlight = firstValueFrom(this.http.get<UserProfile>('/api/me'))
      .then((profile) => {
        this.profile.set(profile);
        this.auth.setRoles(profile.roles ?? []);
        this.loading.set(false);
        return profile;
      })
      .catch((e) => {
        this.error.set(
          `No se pudo cargar el perfil (${e.status ?? e.message}). ¿Está corriendo el backend en :8080?`,
        );
        this.loading.set(false);
        return null;
      })
      .finally(() => {
        this.inFlight = null;
      });
    return this.inFlight;
  }

  clear(): void {
    this.profile.set(null);
    this.error.set(null);
    this.loading.set(false);
    this.inFlight = null;
  }
}
