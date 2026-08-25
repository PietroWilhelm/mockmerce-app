import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addFavorite, removeFavorite } from '@/services/favorites';
import { queryKeys } from '@/lib/queryKeys';

export function useFavoriteMutations() {
  const queryClient = useQueryClient();
  const key = queryKeys.favorites.list();

  // Mutation para adicionar aos favoritos
  const addToFavorites = useMutation({
    mutationFn: (variantId: string) => addFavorite(variantId), // pega o id da variante e chama a função addFavorite
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  const removeFromFavorites = useMutation({
    mutationFn: (variantId: string) => removeFavorite(variantId), // remove através do id da variante e chama a função removeFavorite
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  return { addToFavorites, removeFromFavorites };
}
