import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { OrdersService } from './orders.service';
import {
  NEXT_STATUS,
  Order,
  OrderStatus,
  STATUS_BADGE,
  STATUS_LABELS,
} from './orders.models';

/**
 * Pantalla de pedidos.
 *  - CLIENTE: sus pedidos; puede cancelar los que siguen PENDIENTE.
 *  - ADMIN / OPERADOR: todos los pedidos, con filtro por estado, avanzar
 *    estado y cancelar.
 */
@Component({
  selector: 'app-orders-page',
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './orders-page.html',
})
export class OrdersPage implements OnInit {
  protected readonly orders = inject(OrdersService);
  protected readonly auth = inject(AuthService);

  protected readonly statuses: OrderStatus[] = [
    'PENDIENTE',
    'EN_PREPARACION',
    'LISTO',
    'ENTREGADO',
    'CANCELADO',
  ];
  protected statusFilter: OrderStatus | '' = '';
  protected readonly expanded = signal<Set<number>>(new Set());
  protected actionError = signal<string | null>(null);

  protected readonly labels = STATUS_LABELS;
  protected readonly badge = STATUS_BADGE;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    if (this.auth.isStaff()) {
      this.orders.loadAll(this.statusFilter || undefined);
    } else {
      this.orders.loadMine();
    }
  }

  toggle(id: number): void {
    this.expanded.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  nextStatus(order: Order): OrderStatus | undefined {
    return NEXT_STATUS[order.status];
  }

  advance(order: Order): void {
    const next = this.nextStatus(order);
    if (!next) return;
    this.run(this.orders.changeStatus(order.id, next));
  }

  cancel(order: Order): void {
    if (!confirm(`¿Cancelar el pedido #${order.id}?`)) return;
    this.run(this.orders.cancel(order.id));
  }

  canCustomerCancel(order: Order): boolean {
    return !this.auth.isStaff() && order.status === 'PENDIENTE';
  }

  private run(obs: ReturnType<OrdersService['cancel']>): void {
    this.actionError.set(null);
    obs.subscribe({ error: (e) => this.actionError.set(this.orders.message(e)) });
  }
}
