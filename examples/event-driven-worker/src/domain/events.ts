export interface OrderEvents {
  "order.placed": { orderId: string; items: string[] };
  "order.confirmed": { orderId: string };
  "order.failed": { orderId: string; reason: string };
}
