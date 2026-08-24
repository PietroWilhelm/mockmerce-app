import { useQuery } from '@tanstack/react-query';
import { listProducts, type ListProductsParams } from '@/services/products';
import { queryKeys } from '@/lib/queryKeys';

export function useProducts(params: ListProductsParams = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => listProducts(params),
    placeholderData: (previous) => previous,
  });
}
