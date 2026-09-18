import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { OrdersService } from '../orders/orders.service';
import { KITCHEN_STATUSES, NEXT_STATUS, Order, STATUS_BADGE, STATUS_LABELS } from '../orders/orders.models';

const REFRESH_MS = 20_000;

/**
 * Vista de cocina: solo los pedidos que todavia hay que preparar
 * (PENDIENTE / EN_PREPARACION). Se refresca sola cada 20s para que la
 * pantalla en cocina no dependa de que alguien apriete "actualizar".
 */
@Component({
  selector: 'app-kitchen-page',
  imports: [DatePipe],
  templateUrl: './kitchen-page.html',
})
export class KitchenPage implements OnInit, OnDestroy {
  protected readonly orders = inject(OrdersService);
  protected readonly labels = STATUS_LABELS;
  protected readonly badge = STATUS_BADGE;

  protected readonly visible = computed(() =>
    this.orders.orders().filter((o) => KITCHEN_STATUSES.includes(o.status)),
  );

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.reload();
    this.timer = setInterval(() => this.reload(), REFRESH_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  reload(): void {
    this.orders.loadAll();
  }

  nextStatus(order: Order) {
    return NEXT_STATUS[order.status];
  }

  advance(order: Order): void {
    const next = this.nextStatus(order);
    if (!next) return;
    this.orders.changeStatus(order.id, next).subscribe();
  }
}
