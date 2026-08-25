import { useQuery } from '@tanstack/react-query';
import { listFavorites } from '@/services/favorites';
import { queryKeys } from '@/lib/queryKeys';
import { useSession } from '@/session/session';

export function useFavorites() {
  const { isLoggedIn } = useSession();
  return useQuery({
    queryKey: queryKeys.favorites.list(),
    queryFn: listFavorites,
    enabled: isLoggedIn,
  });
}
