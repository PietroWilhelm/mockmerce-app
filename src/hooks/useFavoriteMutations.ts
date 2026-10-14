import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite, removeFavorite } from '@/services/favorites';
import { queryKeys } from '@/lib/queryKeys';
import type { FavoriteItem } from '@/types/api';

/**
 * Favoritar é OTIMISTA desde o CP5: a estrela precisa mudar no toque, porque
 * a animação de confirmação (RF-50) reage ao estado do cache. Esperar a ida e
 * volta da rede faria a "confirmação" chegar meio segundo depois do dedo.
 * Se o servidor recusar, o cache volta ao que era — e a estrela também.
 */
export function useFavoriteMutations() {
  const queryClient = useQueryClient();
  const key = queryKeys.favorites.list();

  async function snapshot() {
    await queryClient.cancelQueries({ queryKey: key });
    return queryClient.getQueryData<FavoriteItem[]>(key);
  }

  const rollback = (_error: unknown, _vars: unknown, context?: { previous?: FavoriteItem[] }) => {
    if (context?.previous) queryClient.setQueryData(key, context.previous);
  };

  const settle = () => queryClient.invalidateQueries({ queryKey: key });

  const addToFavorites = useMutation({
    mutationFn: (item: FavoriteItem) => addFavorite(item.variantId),
    async onMutate(item) {
      const previous = await snapshot();
      queryClient.setQueryData<FavoriteItem[]>(key, [...(previous ?? []), item]);
      return { previous };
    },
    onError: rollback,
    onSettled: settle,
  });

  const removeFromFavorites = useMutation({
    mutationFn: (variantId: string) => removeFavorite(variantId),
    async onMutate(variantId) {
      const previous = await snapshot();
      queryClient.setQueryData<FavoriteItem[]>(
        key,
        (previous ?? []).filter((favorite) => favorite.variantId !== variantId),
      );
      return { previous };
    },
    onError: rollback,
    onSettled: settle,
  });

  return { addToFavorites, removeFromFavorites };
}
