import { useCallback, useEffect, useState } from 'react';
import { getCurrentPosition, type PositionResult } from '@/services/location';
import type { Coordinate } from '@/types/api';

export type LocationStatus = 'idle' | 'locating' | 'ok' | 'denied' | 'no-position';

/**
 * Estado da posição do aparelho. Expõe o `status`, e não só a coordenada,
 * para a tela distinguir "ainda tentando" de "não vai rolar" (RF-43).
 *
 * `enabled` existe para pedir a permissão no momento certo: a tela de
 * retirada liga ao abrir; o checkout só liga quando o cliente escolhe
 * "Retirar num ponto".
 */
export function useLocation(enabled = true) {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [position, setPosition] = useState<Coordinate | null>(null);
  const [lastResult, setLastResult] = useState<PositionResult | null>(null);

  const locate = useCallback(async () => {
    setStatus('locating');
    const result = await getCurrentPosition();
    setLastResult(result);
    if (result.status === 'ok') setPosition(result.position);
    setStatus(result.status);
  }, []);

  useEffect(() => {
    if (enabled && status === 'idle') locate();
  }, [enabled, status, locate]);

  return {
    status,
    position,
    /** Permissão negada e o sistema não pergunta mais: só os Ajustes resolvem. */
    mustOpenSettings: lastResult?.status === 'denied' && !lastResult.canAskAgain,
    noPositionReason: lastResult?.status === 'no-position' ? lastResult.reason : null,
    retry: locate,
  };
}
