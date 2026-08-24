import { useQuery } from '@tanstack/react-query';
import { getCart } from '@/services/cart';
import { queryKeys } from '@/lib/queryKeys';
import { useSession } from '@/session/session';

export function useCart() {
  const { isLoggedIn } = useSession();
  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: getCart,
    enabled: isLoggedIn,
  });
}