import { http } from './http';
import type { Order, OrderTimelineEvent } from '@/types/api';

/**
 * Sem `pickupPointId` o pedido é entrega; com ele, retirada naquele ponto e o
 * pedido volta com `pickup` preenchido (RF-47).
 */
export async function checkout(pickupPointId?: string): Promise<Order> {
  const { data } = await http.post<Order>('/orders/checkout', pickupPointId ? { pickupPointId } : {});
  return data;
}

export async function listOrders(): Promise<Order[]> {
  const { data } = await http.get<Order[]>('/orders');
  return data;
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await http.get<Order>(`/orders/${id}`);
  return data;
}

export interface PayOrderInput {
  method: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  simulate?: 'approve' | 'decline';
}

export async function payOrder(id: string, input: PayOrderInput): Promise<Order> {
  const { data } = await http.post<Order>(`/orders/${id}/pay`, input);
  return data;
}

export async function cancelOrder(id: string): Promise<Order> {
  const { data } = await http.post<Order>(`/orders/${id}/cancel`);
  return data;
}

export async function getOrderTimeline(id: string): Promise<OrderTimelineEvent[]> {
  const { data } = await http.get<OrderTimelineEvent[]>(`/orders/${id}/timeline`);
  return data;
}
