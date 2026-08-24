import { useQuery } from '@tanstack/react-query';
import { getOrder, getOrderTimeline, listOrders } from '@/services/orders';
import { queryKeys } from '@/lib/queryKeys';

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders.list(),
    queryFn: listOrders,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => getOrder(id),
    enabled: Boolean(id),
  });
}

export function useOrderTimeline(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.timeline(id),
    queryFn: () => getOrderTimeline(id),
    enabled: Boolean(id),
  });
}
