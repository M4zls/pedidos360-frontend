import { Component, computed, input, linkedSignal } from '@angular/core';

const EMOJI: Record<string, string> = {
  hamburguesas: '🍔',
  tacos: '🌮',
  sándwiches: '🥪',
  sandwiches: '🥪',
  acompañamientos: '🍟',
  acompanamientos: '🍟',
  bebidas: '🥤',
  postres: '🍰',
};

const GRADIENT: Record<string, string> = {
  hamburguesas: 'from-amber-500/25 to-orange-700/25',
  tacos: 'from-lime-500/25 to-emerald-700/25',
  sándwiches: 'from-yellow-500/25 to-amber-700/25',
  sandwiches: 'from-yellow-500/25 to-amber-700/25',
  acompañamientos: 'from-orange-500/25 to-red-700/25',
  acompanamientos: 'from-orange-500/25 to-red-700/25',
  bebidas: 'from-sky-500/25 to-indigo-700/25',
  postres: 'from-pink-500/25 to-rose-700/25',
};

/**
 * Imagen de un producto de la carta. Si no hay URL o la imagen falla, muestra
 * un degradado + emoji segun la categoria. Se usa en la carta, el inventario
 * y el detalle de pedidos.
 */
@Component({
  selector: 'app-food-image',
  template: `
    @if (src() && !failed()) {
      <img
        [src]="src()" [alt]="alt()" (error)="failed.set(true)"
        loading="lazy" class="h-full w-full object-cover"
      />
    } @else {
      <div class="flex h-full w-full items-center justify-center bg-gradient-to-br {{ gradient() }}">
        <span [style.fontSize]="emojiSize()">{{ emoji() }}</span>
      </div>
    }
  `,
})
export class FoodImage {
  readonly src = input<string | null>(null);
  readonly alt = input('');
  readonly category = input<string | null>(null);
  /** Tamaño del emoji de fallback (px). */
  readonly emojiSize = input('2.5rem');

  protected readonly failed = linkedSignal<string | null, boolean>({
    source: () => this.src(),
    computation: () => false,
  });

  private readonly key = computed(() => (this.category() ?? '').trim().toLowerCase());
  protected readonly emoji = computed(() => EMOJI[this.key()] ?? '🍽️');
  protected readonly gradient = computed(
    () => GRADIENT[this.key()] ?? 'from-neutral-600/25 to-neutral-800/25',
  );
}
