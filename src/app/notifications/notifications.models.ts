/** Forma comun para el front, sea una alerta de stock (staff) o una notificacion de pedido (cliente). */
export interface NotificationItem {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
}

/** GET /api/inventory/alerts (staff). */
export interface StockAlertResponse {
  id: number;
  productId: number;
  productName: string;
  message: string;
  read: boolean;
  createdAt: string;
}

/** GET /api/orders/notifications/mine (cliente). */
export interface OrderNotificationResponse {
  id: number;
  orderId: number;
  message: string;
  read: boolean;
  createdAt: string;
}
