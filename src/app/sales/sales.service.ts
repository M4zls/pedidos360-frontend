import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { SalesReport } from './sales.models';

const BASE = '/api/orders/reports';

@Injectable({ providedIn: 'root' })
export class SalesService {
  private http = inject(HttpClient);

  readonly report = signal<SalesReport | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<SalesReport>(`${BASE}/sales`).subscribe({
      next: (report) => {
        this.report.set(report);
        this.loading.set(false);
      },
      error: (e) => {
        this.report.set(null);
        this.error.set(this.message(e));
        this.loading.set(false);
      },
    });
  }

  message(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const detail = e.error?.detail as string | undefined;
      if (detail) return detail;
      if (e.status === 0) return 'No se pudo contactar al backend (:8081).';
      return `Error ${e.status}`;
    }
    return 'Error inesperado';
  }
}
