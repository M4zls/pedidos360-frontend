import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { InventoryService } from '../inventory/inventory.service';
import { Product } from '../inventory/inventory.models';
import { OrdersService } from '../orders/orders.service';
import { FoodImage } from '../shared/food-image';

interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Home / carta de productos. Es la pantalla de aterrizaje despues del login.
 *  - CLIENTE: arma un pedido (carrito) y lo confirma -> /orders.
 *  - ADMIN / OPERADOR: ve la carta con stock y accede a la gestion.
 */
@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink, CurrencyPipe, FoodImage],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  protected readonly inventory = inject(InventoryService);
  protected readonly auth = inject(AuthService);
  private readonly orders = inject(OrdersService);
  private readonly router = inject(Router);

  protected note = '';
  protected submitting = signal(false);
  protected submitError = signal<string | null>(null);

  /** Categoria activa para las pills ('' = todas). */
  protected readonly activeCategory = signal('');
  protected readonly filtered = computed(() => {
    const cat = this.activeCategory();
    const list = this.inventory.products();
    return cat ? list.filter((p) => p.category === cat) : list;
  });

  /** productId -> item del carrito. */
  private readonly cart = signal<Map<number, CartItem>>(new Map());

  protected readonly cartItems = computed(() => [...this.cart().values()]);
  protected readonly cartCount = computed(() =>
    this.cartItems().reduce((n, it) => n + it.quantity, 0),
  );
  protected readonly cartTotal = computed(() =>
    this.cartItems().reduce((sum, it) => sum + it.product.unitPrice * it.quantity, 0),
  );

  ngOnInit(): void {
    this.inventory.load();
  }

  setCategory(cat: string): void {
    this.activeCategory.set(cat);
  }

  qtyInCart(productId: number): number {
    return this.cart().get(productId)?.quantity ?? 0;
  }

  add(product: Product): void {
    this.cart.update((map) => {
      const next = new Map(map);
      const current = next.get(product.id);
      next.set(product.id, { product, quantity: (current?.quantity ?? 0) + 1 });
      return next;
    });
  }

  setQty(product: Product, quantity: number): void {
    this.cart.update((map) => {
      const next = new Map(map);
      if (quantity > 0) {
        next.set(product.id, { product, quantity });
      } else {
        next.delete(product.id);
      }
      return next;
    });
  }

  clearCart(): void {
    this.cart.set(new Map());
    this.note = '';
    this.submitError.set(null);
  }

  confirm(): void {
    if (this.cartItems().length === 0 || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    this.orders
      .create({
        note: this.note.trim() || null,
        lines: this.cartItems().map((it) => ({
          productId: it.product.id,
          quantity: it.quantity,
        })),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.clearCart();
          this.router.navigateByUrl('/orders');
        },
        error: (e) => {
          this.submitting.set(false);
          this.submitError.set(this.orders.message(e));
        },
      });
  }
}
