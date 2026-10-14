import { useQuery } from '@tanstack/react-query';
import { listPickupPoints } from '@/services/pickupPoints';
import { queryKeys } from '@/lib/queryKeys';
import { useLocation } from './useLocation';

/**
 * Pontos de retirada + posição do aparelho.
 *
 * Decisão: NÃO esperamos o GPS para buscar. A lista sai na hora, sem posição
 * (ordem de cadastro), e quando a posição chega a busca é refeita, agora
 * ordenada por distância. O `placeholderData` mantém a lista anterior na tela
 * durante a troca, para ela não piscar para o spinner.
 *
 * Assim, negar o GPS nunca deixa a tela travada (RF-45): a lista já estava lá.
 */
export function usePickupPoints(options: { locate?: boolean } = {}) {
  const location = useLocation(options.locate ?? true);
  const position = location.status === 'ok' ? location.position : null;

  const query = useQuery({
    queryKey: queryKeys.pickupPoints.list(position),
    queryFn: () => listPickupPoints(position),
    placeholderData: (previous) => previous,
  });

  return {
    ...query,
    points: query.data?.data ?? [],
    /** true só quando a lista na tela é a ordenada por distância. */
    isSortedByDistance: query.data?.origin != null && !query.isPlaceholderData,
    location,
  };
}
