import * as Location from 'expo-location';
import type { Coordinate } from '@/types/api';

/**
 * Os TRÊS desfechos de pedir a posição (RF-43):
 *   ok          -> permissão concedida e temos coordenada
 *   denied      -> permissão negada
 *   no-position -> permissão concedida, mas sem leitura (GPS desligado,
 *                  dentro de prédio, emulador sem posição, timeout)
 */
export type PositionResult =
  | { status: 'ok'; position: Coordinate }
  | { status: 'denied'; canAskAgain: boolean }
  | { status: 'no-position'; reason: 'services-off' | 'timeout' | 'error' };

/**
 * `getCurrentPositionAsync` pode simplesmente nunca voltar. Sem um teto, a
 * tela fica para sempre em "Obtendo localização" — exatamente o que o
 * critério do RF-45 reprova.
 */
const POSITION_TIMEOUT_MS = 8000;
/** Uma posição conhecida de até 10 min atrás serve para "qual ponto é mais perto". */
const LAST_KNOWN_MAX_AGE_MS = 10 * 60 * 1000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | 'timeout'> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve('timeout'), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function toCoordinate(location: Location.LocationObject): Coordinate {
  return { latitude: location.coords.latitude, longitude: location.coords.longitude };
}

export async function getCurrentPosition(): Promise<PositionResult> {
  try {
    // Só "foreground": posição enquanto o app está aberto. Não pedimos o que não usamos.
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { status: 'denied', canAskAgain: permission.canAskAgain };

    if (!(await Location.hasServicesEnabledAsync())) {
      return { status: 'no-position', reason: 'services-off' };
    }

    // `Balanced` (~100 m) responde rápido e basta para comparar pontos de retirada.
    const current = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      POSITION_TIMEOUT_MS,
    );
    if (current !== 'timeout') return { status: 'ok', position: toCoordinate(current) };

    const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS });
    if (lastKnown) return { status: 'ok', position: toCoordinate(lastKnown) };
    return { status: 'no-position', reason: 'timeout' };
  } catch {
    return { status: 'no-position', reason: 'error' };
  }
}
