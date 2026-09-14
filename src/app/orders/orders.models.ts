export type OrderStatus =
  | 'PENDIENTE'
  | 'EN_PREPARACION'
  | 'LISTO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface OrderLine {
  productId: number;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  customerEmail: string;
  customerName: string;
  status: OrderStatus;
  note: string | null;
  total: number;
  lines: OrderLine[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  note: string | null;
  lines: { productId: number; quantity: number }[];
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

/** Clases Tailwind para el badge de cada estado (tema oscuro). */
export const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDIENTE: 'bg-amber-500/15 text-amber-300',
  EN_PREPARACION: 'bg-sky-500/15 text-sky-300',
  LISTO: 'bg-indigo-500/15 text-indigo-300',
  ENTREGADO: 'bg-emerald-500/15 text-emerald-300',
  CANCELADO: 'bg-white/10 text-neutral-400',
};

/** Estado siguiente en el flujo normal (para el boton "avanzar" del staff). */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDIENTE: 'EN_PREPARACION',
  EN_PREPARACION: 'LISTO',
  LISTO: 'ENTREGADO',
};
