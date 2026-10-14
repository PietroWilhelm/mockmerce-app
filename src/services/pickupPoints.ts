import { http } from './http';
import type { Coordinate, PickupPointsResponse } from '@/types/api';

/**
 * COM posição -> a API ordena por distância e preenche `distanceKm`.
 * SEM posição -> lista na ordem de cadastro, `distanceKm` null. Não é erro:
 * é o caso de quem negou o GPS (RF-45).
 */
export async function listPickupPoints(position: Coordinate | null): Promise<PickupPointsResponse> {
  const { data } = await http.get<PickupPointsResponse>('/pickup-points', {
    // `undefined` em params é omitido pelo axios: sem posição, a URL sai limpa.
    params: { latitude: position?.latitude, longitude: position?.longitude },
  });
  return data;
}
