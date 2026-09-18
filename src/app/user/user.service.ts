import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService, Role } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';

/** Datos del usuario autenticado que devuelve GET /api/me. */
export interface UserProfile {
  sub?: string;
  name?: string;
  email?: string;
  provider?: 'microsoft';
  /** Rol resuelto por email (fijo, ver app.roles en el backend). */
  roles?: Role[];
  /** Si ya acepto guardar sus datos (proteccion de datos). */
  consentGiven?: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
  microsoft: 'Microsoft',
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
  private notifications = inject(NotificationsService);

  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private inFlight: Promise<UserProfile | null> | null = null;

  /** Iniciales para el avatar (no hay foto en el token de Microsoft). */
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
        this.auth.consentGiven.set(profile.consentGiven ?? false);
        this.notifications.start();
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

  /** Registra el consentimiento de datos del usuario logueado. */
  giveConsent(): Promise<void> {
    return firstValueFrom(this.http.post<void>('/api/me/consent', {})).then(() => {
      this.auth.consentGiven.set(true);
      const current = this.profile();
      if (current) {
        this.profile.set({ ...current, consentGiven: true });
      }
    });
  }

  clear(): void {
    this.profile.set(null);
    this.error.set(null);
    this.loading.set(false);
    this.inFlight = null;
    this.notifications.stop();
  }
}
