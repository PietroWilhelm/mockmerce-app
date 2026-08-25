import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite, removeFavorite } from '@/services/favorites';
import { queryKeys } from '@/lib/queryKeys';

export function useFavoriteMutations() {
  const queryClient = useQueryClient();
  const key = queryKeys.favorites.list();

  const addToFavorites = useMutation({
    mutationFn: (variantId: string) => addFavorite(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const removeFromFavorites = useMutation({
    mutationFn: (variantId: string) => removeFavorite(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return { addToFavorites, removeFromFavorites };
}
