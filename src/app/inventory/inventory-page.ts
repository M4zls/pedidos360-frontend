import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InventoryService } from './inventory.service';
import { Product } from './inventory.models';
import { ProductForm } from './product-form';
import { MovementPanel } from './movement-panel';
import { FoodImage } from '../shared/food-image';

type Panel =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'edit'; product: Product }
  | { kind: 'movements'; product: Product };

@Component({
  selector: 'app-inventory-page',
  imports: [FormsModule, CurrencyPipe, ProductForm, MovementPanel, FoodImage],
  templateUrl: './inventory-page.html',
})
export class InventoryPage implements OnInit {
  protected readonly inventory = inject(InventoryService);

  protected category = '';
  protected onlyLowStock = false;
  protected readonly panel = signal<Panel>({ kind: 'none' });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.inventory.load({
      category: this.category || undefined,
      onlyLowStock: this.onlyLowStock,
    });
  }

  openCreate(): void {
    this.panel.set({ kind: 'create' });
  }

  openEdit(product: Product): void {
    this.panel.set({ kind: 'edit', product });
  }

  openMovements(product: Product): void {
    this.panel.set({ kind: 'movements', product });
  }

  closePanel(): void {
    this.panel.set({ kind: 'none' });
  }

  onSaved(): void {
    this.closePanel();
    this.reload();
  }

  deactivate(product: Product): void {
    if (!confirm(`¿Dar de baja "${product.name}"?`)) return;
    this.inventory.deactivate(product.id).subscribe({
      error: (e) => alert(this.inventory.message(e)),
    });
  }
}
