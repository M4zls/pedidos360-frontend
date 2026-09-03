import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';

/** Datos del usuario autenticado que devuelve GET /api/me (Microsoft o local). */
export interface UserProfile {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  provider?: 'microsoft' | 'local';
}

const PROVIDER_LABELS: Record<string, string> = {
  microsoft: 'Microsoft',
  local: 'usuario y contraseña',
};

/**
 * Carga y cachea el perfil del usuario logueado. Lo consumen el menu de
 * perfil del header y el panel, sin que cada uno haga su propia llamada.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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

  /** Trae el perfil desde el backend. No repite la llamada si ya esta cargado (salvo force). */
  load(force = false): void {
    if (this.loading()) return;
    if (this.profile() && !force) return;

    const token = this.auth.idToken;
    if (!token) {
      this.error.set('No hay sesión activa.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.http
      .get<UserProfile>('/api/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(
            `No se pudo cargar el perfil (${e.status ?? e.message}). ¿Está corriendo el backend en :8080?`,
          );
          this.loading.set(false);
        },
      });
  }

  clear(): void {
    this.profile.set(null);
    this.error.set(null);
    this.loading.set(false);
  }
}
