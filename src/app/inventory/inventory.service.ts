import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  CreateProductRequest,
  Product,
  StockMovement,
  StockMovementRequest,
  UpdateProductRequest,
} from './inventory.models';

const BASE = '/api/inventory';

/**
 * Estado del inventario en el front. Mantiene la lista de productos en un
 * signal; las acciones (alta, edicion, baja, movimientos) pegan al backend y
 * refrescan la lista. El Bearer lo agrega authInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** Categorias presentes, para el filtro. */
  readonly categories = computed(() =>
    [...new Set(this.products().map((p) => p.category).filter((c): c is string => !!c))].sort(),
  );

  load(opts: { category?: string; onlyLowStock?: boolean } = {}): void {
    this.loading.set(true);
    this.error.set(null);

    const url = opts.onlyLowStock
      ? `${BASE}/low-stock`
      : `${BASE}/products${opts.category ? `?category=${encodeURIComponent(opts.category)}` : ''}`;

    this.http.get<Product[]>(url).subscribe({
      next: (list) => {
        this.products.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.products.set([]);
        this.error.set(this.message(e));
        this.loading.set(false);
      },
    });
  }

  create(body: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(`${BASE}/products`, body).pipe(tap((p) => this.upsert(p)));
  }

  update(id: number, body: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${BASE}/products/${id}`, body).pipe(tap((p) => this.upsert(p)));
  }

  deactivate(id: number): Observable<void> {
    return this.http
      .delete<void>(`${BASE}/products/${id}`)
      .pipe(tap(() => this.products.update((list) => list.filter((p) => p.id !== id))));
  }

  movements(productId: number): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${BASE}/products/${productId}/movements`);
  }

  registerMovement(productId: number, body: StockMovementRequest): Observable<StockMovement> {
    return this.http
      .post<StockMovement>(`${BASE}/products/${productId}/movements`, body)
      .pipe(
        tap((m) =>
          this.products.update((list) =>
            list.map((p) =>
              p.id === productId
                ? { ...p, stock: m.resultingStock, lowStock: p.active && m.resultingStock <= p.minStock }
                : p,
            ),
          ),
        ),
      );
  }

  /** Traduce el error del backend (ProblemDetail) a un texto para la UI. */
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

  private upsert(product: Product): void {
    this.products.update((list) => {
      const i = list.findIndex((p) => p.id === product.id);
      if (i === -1) return [...list, product];
      const copy = [...list];
      copy[i] = product;
      return copy;
    });
  }
}
