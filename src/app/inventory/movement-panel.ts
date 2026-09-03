import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InventoryService } from './inventory.service';
import { MovementType, Product, StockMovement } from './inventory.models';

/** Registrar entradas/salidas/ajustes de stock de un producto y ver su historial. */
@Component({
  selector: 'app-movement-panel',
  imports: [FormsModule, DatePipe],
  templateUrl: './movement-panel.html',
})
export class MovementPanel implements OnInit {
  private inventory = inject(InventoryService);

  readonly product = input.required<Product>();
  readonly closed = output<void>();

  protected readonly history = signal<StockMovement[]>([]);
  protected readonly loadingHistory = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected type: MovementType = 'IN';
  protected quantity = 1;
  protected reason = '';

  ngOnInit(): void {
    this.loadHistory();
  }

  submit(): void {
    this.error.set(null);
    this.saving.set(true);
    this.inventory
      .registerMovement(this.product().id, {
        type: this.type,
        quantity: this.quantity,
        reason: this.reason.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.quantity = 1;
          this.reason = '';
          this.loadHistory();
        },
        error: (e) => {
          this.saving.set(false);
          this.error.set(this.inventory.message(e));
        },
      });
  }

  private loadHistory(): void {
    this.loadingHistory.set(true);
    this.inventory.movements(this.product().id).subscribe({
      next: (list) => {
        this.history.set(list);
        this.loadingHistory.set(false);
      },
      error: (e) => {
        this.error.set(this.inventory.message(e));
        this.loadingHistory.set(false);
      },
    });
  }
}
