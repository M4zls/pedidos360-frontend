import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { interval, map, Subscription, switchMap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { NotificationItem, OrderNotificationResponse, StockAlertResponse } from './notifications.models';

const POLL_MS = 30_000;

/**
 * Notificaciones in-app, por polling (sin websockets). El origen depende del
 * rol: staff ve alertas de stock bajo (inventory-service); cliente ve avisos
 * de sus propios pedidos (orders-service). Cada uno pega a un backend
 * distinto, pero el front las trata igual (mismo shape `NotificationItem`).
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  readonly items = signal<NotificationItem[]>([]);
  readonly unreadCount = computed(() => this.items().filter((n) => !n.read).length);

  private pollSub?: Subscription;

  /** Arranca el polling. Se llama al cargar el perfil (ver UserService.ensureLoaded). */
  start(): void {
    this.stop();
    this.load();
    this.pollSub = interval(POLL_MS)
      .pipe(switchMap(() => this.fetch()))
      .subscribe((list) => this.items.set(list));
  }

  stop(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
    this.items.set([]);
  }

  load(): void {
    this.fetch().subscribe((list) => this.items.set(list));
  }

  markRead(id: number): void {
    const url = this.auth.isStaff()
      ? `/api/inventory/alerts/${id}/read`
      : `/api/orders/notifications/${id}/read`;
    this.http.patch<void>(url, {}).subscribe({
      next: () => {
        this.items.update((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
      },
    });
  }

  private fetch() {
    if (this.auth.isStaff()) {
      return this.http.get<StockAlertResponse[]>('/api/inventory/alerts').pipe(
        map((list) => list.map((a) => this.fromAlert(a))),
      );
    }
    return this.http.get<OrderNotificationResponse[]>('/api/orders/notifications/mine').pipe(
      map((list) => list.map((n) => this.fromOrderNotification(n))),
    );
  }

  private fromAlert(a: StockAlertResponse): NotificationItem {
    return { id: a.id, message: a.message, read: a.read, createdAt: a.createdAt };
  }

  private fromOrderNotification(n: OrderNotificationResponse): NotificationItem {
    return { id: n.id, message: n.message, read: n.read, createdAt: n.createdAt };
  }
}
