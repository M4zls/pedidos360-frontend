import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { OrdersService } from '../orders/orders.service';
import { DISPATCH_STATUSES, NEXT_STATUS, Order, STATUS_BADGE, STATUS_LABELS } from '../orders/orders.models';

const REFRESH_MS = 20_000;

/**
 * Vista de despacho: pedidos LISTO (para salir) o DESPACHADO (en camino).
 * Se refresca sola cada 20s, igual que cocina.
 */
@Component({
  selector: 'app-dispatch-page',
  imports: [DatePipe],
  templateUrl: './dispatch-page.html',
})
export class DispatchPage implements OnInit, OnDestroy {
  protected readonly orders = inject(OrdersService);
  protected readonly labels = STATUS_LABELS;
  protected readonly badge = STATUS_BADGE;

  protected readonly visible = computed(() =>
    this.orders.orders().filter((o) => DISPATCH_STATUSES.includes(o.status)),
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
