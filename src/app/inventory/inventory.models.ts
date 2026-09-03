export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  unitPrice: number;
  stock: number;
  minStock: number;
  active: boolean;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: number;
  productId: number;
  productSku: string;
  type: MovementType;
  quantity: number;
  resultingStock: number;
  reason: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  category: string | null;
  unit: string;
  unitPrice: number;
  minStock: number;
  initialStock: number;
}

export interface UpdateProductRequest {
  name: string;
  category: string | null;
  unit: string;
  unitPrice: number;
  minStock: number;
  active: boolean;
}

export interface StockMovementRequest {
  type: MovementType;
  quantity: number;
  reason: string | null;
}

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  IN: 'Entrada',
  OUT: 'Salida',
  ADJUSTMENT: 'Ajuste',
};
