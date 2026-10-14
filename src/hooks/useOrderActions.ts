import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelOrder, checkout, payOrder, type PayOrderInput } from '@/services/orders';
import { queryKeys } from '@/lib/queryKeys';
import type { Order } from '@/types/api';

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    // `undefined` = entrega; um id = retirada naquele ponto (RF-47).
    mutationFn: (pickupPointId?: string) => checkout(pickupPointId),
    onSuccess: (order) => {
      queryClient.setQueryData<Order>(queryKeys.orders.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
}

// Pagamento não é otimista: esperamos a resposta do servidor e só então
// reconciliamos o cache. Diferente do carrinho, aqui não vale arriscar.
export function usePayOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PayOrderInput) => payOrder(id, input),
    onSuccess: (order) => {
      queryClient.setQueryData<Order>(queryKeys.orders.detail(id), order);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.timeline(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() });
      // Pagar muda o "pode avaliar": antes era NOT_PURCHASED, agora libera.
      // Sem isto, o botão de avaliar só apareceria depois de reabrir o app.
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
    },
  });
}

export function useCancelOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelOrder(id),
    onSuccess: (order) => {
      queryClient.setQueryData<Order>(queryKeys.orders.detail(id), order);
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.timeline(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list() });
    },
  });
}
