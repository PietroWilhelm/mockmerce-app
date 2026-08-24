import { useQuery } from '@tanstack/react-query';
import { getProduct } from '@/services/products';
import { queryKeys } from '@/lib/queryKeys';

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => getProduct(id),
    enabled: Boolean(id),
  });
}
