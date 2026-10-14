/**
 * Configuração global das notificações + tradução de payload.
 *
 * Este arquivo é importado no topo do App.tsx: o handler precisa estar
 * instalado ANTES da primeira notificação chegar, senão ela é engolida.
 *
 * Caminho B (notificação local): quem "entrega" é o próprio app. Ao abrir, ele
 * lê o histórico da loja (GET /push/messages) e apresenta o que for novo com
 * `scheduleNotificationAsync`. O toque e o deep link funcionam igual a um push
 * remoto — inclusive com o app fechado.
 */
import * as Notifications from '@/lib/expoNotifications';
import { Platform } from 'react-native';
import { defaultTheme } from '@/theme/theme';
import type { DeepLinkTarget } from '@/navigation';
import type { StoreMessage } from '@/types/api';

/** Precisa ser o mesmo id em quem cria o canal e em quem agenda a notificação. */
export const ANDROID_CHANNEL_ID = 'store-notices';

/**
 * Com o app ABERTO o padrão do sistema é não mostrar nada. Decisão de produto:
 * mostrar mesmo assim — "o preço do que você salvou caiu" merece interromper.
 * Sem badge: não temos regra de "não lidos", então o número só acumularia.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Canal do Android (obrigatório desde o Android 8). No Android 13+ ele precisa
 * existir ANTES do pedido de permissão, senão o diálogo nem aparece.
 * Criar de novo com o mesmo id não duplica. No iOS não existe canal.
 */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Avisos da loja',
    description: 'Queda de preço, novidades e avisos do Dr.Mouse.',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: defaultTheme.primary,
  });
}

// ---- Permissão --------------------------------------------------------------

/**
 * Desfechos da permissão (RF-56):
 *   undetermined -> nunca perguntamos (ou o sistema ainda deixa perguntar)
 *   granted      -> concedida
 *   dismissed    -> acabou de recusar, mas o sistema deixa perguntar de novo
 *   denied       -> recusada de vez: só os Ajustes do aparelho resolvem
 * `checking` é o instante da leitura; `unavailable` é o ambiente (web).
 */
export type NotificationPermission =
  | 'checking'
  | 'undetermined'
  | 'granted'
  | 'dismissed'
  | 'denied'
  | 'unavailable';

function isGranted(permission: Notifications.NotificationPermissionsStatus): boolean {
  return (
    permission.granted ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

/** Lê sem incomodar ninguém. */
export async function readNotificationPermission(): Promise<NotificationPermission> {
  if (Platform.OS === 'web') return 'unavailable';
  const permission = await Notifications.getPermissionsAsync();
  if (isGranted(permission)) return 'granted';
  return permission.canAskAgain ? 'undetermined' : 'denied';
}

/** Abre o diálogo do sistema. Só chamar depois de a pessoa entender o que ganha. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (Platform.OS === 'web') return 'unavailable';
  // O canal precisa existir antes do diálogo no Android 13+, mas se a criação
  // falhar o pedido de permissão tem que acontecer mesmo assim.
  await ensureAndroidChannel().catch((error) => console.warn('[avisos] falha ao criar o canal do Android:', error));
  const permission = await Notifications.requestPermissionsAsync();
  if (isGranted(permission)) return 'granted';
  return permission.canAskAgain ? 'dismissed' : 'denied';
}

// ---- Payload ----------------------------------------------------------------

/**
 * RF-58: `title`/`body` são para o humano; `data` é para o app. Num push de
 * verdade o `data` chega como mapa string → string, então normalizamos para
 * esse formato também aqui: o resto do app só lida com um formato.
 */
export type NotificationData = Record<string, string>;

export function normalizeData(raw: unknown): NotificationData {
  if (!raw || typeof raw !== 'object') return {};
  const result: NotificationData = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === null || value === undefined) continue;
    result[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return result;
}

/** O deep link (RF-59): o `data`, e nunca o texto, decide a tela. */
export function targetFromData(data: NotificationData): DeepLinkTarget | null {
  const productId = data.produtoId;
  if ((data.rota === 'produto' || !data.rota) && productId) {
    // O nome não vem no payload; a tela de detalhe corrige o título ao carregar.
    return { screen: 'ProductDetail', params: { id: productId, name: 'Produto' } };
  }
  if (data.rota === 'favoritos') return { screen: 'Favorites' };
  if (data.rota === 'home') return { screen: 'Products' };
  return null;
}

/** Só vira notificação o que tem texto para alguém ler (`kind: DATA` é só para o app). */
export function isPresentable(message: StoreMessage): boolean {
  return message.kind === 'NOTIFICATION' && Boolean(message.title || message.body);
}

export async function presentStoreMessage(message: StoreMessage): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: message.title ?? defaultTheme.storeName,
      body: message.body ?? '',
      data: { ...normalizeData(message.data), messageId: message.id },
    },
    // Imediata, no nosso canal (no iOS não há canal: `null` = agora).
    trigger: Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null,
  });
}
