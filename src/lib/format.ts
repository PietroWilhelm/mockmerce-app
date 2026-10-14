/**
 * Formata um número em reais. Preços da API vêm como number (ex.: 79.9).
 * Formatação manual (sem Intl) para funcionar igual em qualquer device/Hermes.
 */
export function money(value: number): string {
  const fixed = (Math.round(value * 100) / 100).toFixed(2); // 2 casas
  const [intPart, decPart] = fixed.split('.');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${withThousands},${decPart}`;
}

/** Distância vinda da API (`distanceKm`): "850 m" abaixo de 1 km, "2,9 km" acima. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

/** Endereço em uma linha, pulando o que a loja deixou em branco. */
export function formatPickupAddress(address: {
  street?: string | null;
  number?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
}): string {
  const streetLine = [address.street, address.number].filter(Boolean).join(', ');
  const cityLine = [address.city, address.state].filter(Boolean).join('/');
  return [streetLine, address.district, cityLine].filter(Boolean).join(' · ');
}
