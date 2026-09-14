import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InventoryService } from './inventory.service';
import { Product } from './inventory.models';

interface FormModel {
  sku: string;
  name: string;
  category: string;
  unit: string;
  imageUrl: string;
  unitPrice: number | null;
  minStock: number;
  initialStock: number;
  active: boolean;
}

/** Alta y edicion de un producto. Si recibe `product`, esta en modo edicion. */
@Component({
  selector: 'app-product-form',
  imports: [FormsModule],
  templateUrl: './product-form.html',
})
export class ProductForm implements OnInit {
  private inventory = inject(InventoryService);

  readonly product = input<Product | null>(null);
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly editing = computed(() => this.product() !== null);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected model: FormModel = {
    sku: '',
    name: '',
    category: '',
    unit: 'unidad',
    imageUrl: '',
    unitPrice: null,
    minStock: 0,
    initialStock: 0,
    active: true,
  };

  ngOnInit(): void {
    const p = this.product();
    if (p) {
      this.model = {
        sku: p.sku,
        name: p.name,
        category: p.category ?? '',
        unit: p.unit,
        imageUrl: p.imageUrl ?? '',
        unitPrice: p.unitPrice,
        minStock: p.minStock,
        initialStock: 0,
        active: p.active,
      };
    }
  }

  submit(): void {
    this.error.set(null);
    this.saving.set(true);

    const m = this.model;
    const category = m.category.trim() || null;
    const imageUrl = m.imageUrl.trim() || null;
    const done = {
      next: () => {
        this.saving.set(false);
        this.saved.emit();
      },
      error: (e: unknown) => {
        this.saving.set(false);
        this.error.set(this.inventory.message(e));
      },
    };

    const existing = this.product();
    if (existing) {
      this.inventory
        .update(existing.id, {
          name: m.name.trim(),
          category,
          unit: m.unit.trim(),
          imageUrl,
          unitPrice: m.unitPrice ?? 0,
          minStock: m.minStock,
          active: m.active,
        })
        .subscribe(done);
    } else {
      this.inventory
        .create({
          sku: m.sku.trim(),
          name: m.name.trim(),
          category,
          unit: m.unit.trim(),
          imageUrl,
          unitPrice: m.unitPrice ?? 0,
          minStock: m.minStock,
          initialStock: m.initialStock,
        })
        .subscribe(done);
    }
  }
}
