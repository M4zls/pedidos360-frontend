import { OrderStatus } from '../orders/orders.models';

export interface StatusCount {
  status: OrderStatus;
  count: number;
  total: number;
}

export interface SalesReport {
  totalRevenue: number;
  deliveredCount: number;
  activeCount: number;
  cancelledCount: number;
  byStatus: StatusCount[];
}
