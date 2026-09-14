import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { CreateOrderRequest, Order, OrderStatus } from './orders.models';

const BASE = '/api/orders';

/**
 * Estado de pedidos en el front. Mantiene la lista visible en un signal
 * (los del cliente, o todos si es staff) y expone las acciones. El Bearer lo
 * agrega authInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private http = inject(HttpClient);

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Pedidos del usuario logueado. */
  loadMine(): void {
    this.fetch(`${BASE}/mine`);
  }

  /** Todos los pedidos (staff), con filtro opcional por estado. */
  loadAll(status?: OrderStatus): void {
    this.fetch(`${BASE}${status ? `?status=${status}` : ''}`);
  }

  private fetch(url: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Order[]>(url).subscribe({
      next: (list) => {
        this.orders.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.orders.set([]);
        this.error.set(this.message(e));
        this.loading.set(false);
      },
    });
  }

  create(body: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(BASE, body);
  }

  changeStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.http
      .patch<Order>(`${BASE}/${id}/status`, { status })
      .pipe(tap((o) => this.upsert(o)));
  }

  cancel(id: number): Observable<Order> {
    return this.http.post<Order>(`${BASE}/${id}/cancel`, {}).pipe(tap((o) => this.upsert(o)));
  }

  message(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const detail = e.error?.detail as string | undefined;
      const fieldErrors = e.error?.errors as Record<string, string> | undefined;
      if (fieldErrors) {
        return Object.entries(fieldErrors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(' · ');
      }
      if (detail) return detail;
      if (e.status === 0) return 'No se pudo contactar al backend (:8080).';
      return `Error ${e.status}`;
    }
    return 'Error inesperado';
  }

  private upsert(order: Order): void {
    this.orders.update((list) => {
      const i = list.findIndex((o) => o.id === order.id);
      if (i === -1) return list;
      const copy = [...list];
      copy[i] = order;
      return copy;
    });
  }
}
