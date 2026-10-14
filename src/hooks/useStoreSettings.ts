import { useQuery } from '@tanstack/react-query';
import { getStoreSettings } from '@/services/store';
import { queryKeys } from '@/lib/queryKeys';

/** Configuração da loja: tema (CP1) e localização da loja no mapa (CP5). */
export function useStoreSettings() {
  return useQuery({
    queryKey: queryKeys.store.settings,
    queryFn: getStoreSettings,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
