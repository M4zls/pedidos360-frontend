import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Role } from '../auth/auth.service';

const BASE = '/api/admin/users';

export interface AppUser {
  id: number;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

/** Administracion de roles (solo ADMIN). */
@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private http = inject(HttpClient);

  readonly users = signal<AppUser[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<AppUser[]>(BASE).subscribe({
      next: (list) => {
        this.users.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.users.set([]);
        this.error.set(this.message(e));
        this.loading.set(false);
      },
    });
  }

  updateRole(id: number, role: Role): Observable<AppUser> {
    return this.http.patch<AppUser>(`${BASE}/${id}`, { role }).pipe(
      tap((updated) =>
        this.users.update((list) => list.map((u) => (u.id === id ? updated : u))),
      ),
    );
  }

  message(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const detail = e.error?.detail as string | undefined;
      if (detail) return detail;
      if (e.status === 403) return 'Necesitás rol Administrador.';
      if (e.status === 0) return 'No se pudo contactar al backend (:8080).';
      return `Error ${e.status}`;
    }
    return 'Error inesperado';
  }
}
