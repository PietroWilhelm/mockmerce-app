import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addCartItem, removeCartItem, updateCartItem } from '@/services/cart';
import { queryKeys } from '@/lib/queryKeys';
import type { Cart } from '@/types/api';

const EMPTY_CART: Cart = { id: 'optimistic', items: [], total: 0, itemCount: 0 };

function recompute(items: Cart['items']): Cart {
  const total = items.reduce((sum, it) => sum + it.subtotal, 0);
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);
  return { id: EMPTY_CART.id, items, total, itemCount };
}

export function useCartMutations() {
  const queryClient = useQueryClient();
  const key = queryKeys.cart.all;

  const rollbackOnError = (_e: unknown, _vars: unknown, ctx?: { previous?: Cart }) => {
    if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
  };
  const settle = () => {
    queryClient.invalidateQueries({ queryKey: key });
  };

  const addItem = useMutation({
    mutationFn: (v: { variantId: string; quantity: number; name: string; unitPrice: number }) =>
      addCartItem(v.variantId, v.quantity),
    async onMutate(v) {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Cart>(key);
      const base = previous ?? EMPTY_CART;

      const existing = base.items.find((it) => it.variantId === v.variantId);
      const items = existing
        ? base.items.map((it) =>
          it.variantId === v.variantId
            ? { ...it, quantity: it.quantity + v.quantity, subtotal: it.unitPrice * (it.quantity + v.quantity) }
            : it,
        )
        : [
          ...base.items,
          {
            variantId: v.variantId,
            name: v.name,
            sku: '',
            unitPrice: v.unitPrice,
            quantity: v.quantity,
            subtotal: v.unitPrice * v.quantity,
          },
        ];

      queryClient.setQueryData<Cart>(key, recompute(items));
      return { previous };
    },
    onError: rollbackOnError,
    onSettled: settle,
  });

  const setQuantity = useMutation({
    mutationFn: (v: { variantId: string; quantity: number }) => updateCartItem(v.variantId, v.quantity),
    async onMutate(v) {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Cart>(key);
      const base = previous ?? EMPTY_CART;
      const items = base.items
        .map((it) =>
          it.variantId === v.variantId ? { ...it, quantity: v.quantity, subtotal: it.unitPrice * v.quantity } : it,
        )
        .filter((it) => it.quantity > 0);
      queryClient.setQueryData<Cart>(key, recompute(items));
      return { previous };
    },
    onError: rollbackOnError,
    onSettled: settle,
  });

  const removeItem = useMutation({
    mutationFn: (variantId: string) => removeCartItem(variantId),
    async onMutate(variantId) {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Cart>(key);
      const base = previous ?? EMPTY_CART;
      const items = base.items.filter((it) => it.variantId !== variantId);
      queryClient.setQueryData<Cart>(key, recompute(items));
      return { previous };
    },
    onError: rollbackOnError,
    onSettled: settle,
  });

  return { addItem, setQuantity, removeItem };
}