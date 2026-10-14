/**
 * Notificações — Caminho B (local), em um provider só.
 *
 * Três assuntos que ficam separados aqui:
 *   1. PERMISSÃO  -> pedida no momento certo (depois do primeiro favorito, ou
 *                    pelo botão do Perfil), nunca na abertura (RF-56)
 *   2. ENTREGA    -> ao abrir/voltar para o app, lê GET /push/messages e
 *                    apresenta o que é novo como notificação local (RF-57)
 *   3. TOQUE      -> o `data` vira navegação, com o app aberto, em segundo
 *                    plano ou FECHADO (RF-59)
 *
 * Por que provider e não hook solto: os listeners precisam existir UMA vez.
 * Dois listeners = um toque navegando duas vezes, com a tela empilhada.
 *
 * E a regra do CP5: sem permissão o app continua inteiro. Quem recusa só não
 * recebe o aviso no sistema; os mesmos avisos aparecem no Perfil (RF-60).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import * as Notifications from '@/lib/expoNotifications';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/session/session';
import { navigateFromOutside } from '@/navigation';
import { queryKeys } from '@/lib/queryKeys';
import {
  ensureAndroidChannel,
  isPresentable,
  normalizeData,
  presentStoreMessage,
  readNotificationPermission,
  requestNotificationPermission,
  targetFromData,
  type NotificationPermission,
} from '@/lib/notifications';
import { listStoreMessages } from '@/services/storeMessages';
import { getLastPresentedMessageAt, setLastPresentedMessageAt } from '@/services/localStore';

/** Abrir o app depois de uma semana não pode disparar 20 notificações de uma vez. */
const MAX_PRESENTED_PER_SYNC = 3;

interface NotificationsValue {
  permission: NotificationPermission;
  /** Abre o diálogo do sistema e devolve o desfecho. */
  requestPermission: () => Promise<NotificationPermission>;
  /** Já oferecemos os avisos nesta sessão? (evita perguntar a cada favorito) */
  wasOffered: boolean;
  markOffered: () => void;
  /** Busca avisos novos da loja agora (botão do Perfil). */
  syncNow: () => Promise<void>;
  /** Relê a permissão (botão "Tentar de novo" quando a leitura falhou). */
  refreshPermission: () => Promise<void>;
  /** Mensagem do erro quando a leitura/pedido falhou — para o card e para o log. */
  permissionError: string | null;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const NotificationsContext = createContext<NotificationsValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useSession();
  const queryClient = useQueryClient();
  const [permission, setPermission] = useState<NotificationPermission>('checking');
  const [wasOffered, setWasOffered] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const syncing = useRef(false);

  // Uma falha aqui não derruba o app, mas também não pode sumir em silêncio:
  // vai para o log do Metro e para o card do Perfil.
  const failPermission = useCallback((where: string, error: unknown) => {
    console.warn(`[avisos] falha ao ${where}:`, error);
    setPermissionError(describe(error));
    setPermission('unavailable');
  }, []);

  const refreshPermission = useCallback(async () => {
    try {
      setPermission(await readNotificationPermission());
      setPermissionError(null);
    } catch (error) {
      failPermission('ler a permissão', error);
    }
  }, [failPermission]);

  // ---- 1. permissão: só LÊ na abertura -------------------------------------
  useEffect(() => {
    ensureAndroidChannel().catch((error) => console.warn('[avisos] falha ao criar o canal do Android:', error));
    refreshPermission();
  }, [refreshPermission]);

  const requestPermission = useCallback(async () => {
    setWasOffered(true);
    try {
      const outcome = await requestNotificationPermission();
      setPermission(outcome);
      setPermissionError(null);
      return outcome;
    } catch (error) {
      failPermission('pedir a permissão', error);
      return 'unavailable' as const;
    }
  }, [failPermission]);

  // ---- 2. entrega: consome o histórico da loja -----------------------------
  const syncNow = useCallback(async () => {
    if (syncing.current) return;
    syncing.current = true;
    try {
      // Mesma chave que a lista do Perfil usa: uma busca alimenta as duas.
      const response = await queryClient.fetchQuery({
        queryKey: queryKeys.storeMessages.all,
        queryFn: () => listStoreMessages(),
        staleTime: 0,
      });
      const ordered = [...response.data].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const newest = ordered[ordered.length - 1];
      if (!newest) return;

      const lastPresentedAt = await getLastPresentedMessageAt();
      // Primeira vez neste aparelho: apresenta só o mais recente, e não o histórico inteiro.
      const fresh = lastPresentedAt
        ? ordered.filter((message) => message.createdAt > lastPresentedAt)
        : ordered.slice(-1);

      for (const message of fresh.filter(isPresentable).slice(-MAX_PRESENTED_PER_SYNC)) {
        await presentStoreMessage(message);
      }
      await setLastPresentedMessageAt(newest.createdAt);
    } catch (error) {
      // Falhar aqui não pode derrubar o app: a pessoa só não recebe o aviso agora.
      console.warn('[avisos] não foi possível ler os avisos da loja:', error);
    } finally {
      syncing.current = false;
    }
  }, [queryClient]);

  useEffect(() => {
    if (isLoggedIn && permission === 'granted') syncNow();
  }, [isLoggedIn, permission, syncNow]);

  // Voltar para o app (inclusive vindo dos Ajustes): relê a permissão, que o
  // usuário pode ter mudado lá fora, e procura avisos novos.
  const isLoggedInRef = useRef(isLoggedIn);
  isLoggedInRef.current = isLoggedIn;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      readNotificationPermission()
        .then((current) => {
          setPermission(current);
          setPermissionError(null);
          if (current === 'granted' && isLoggedInRef.current) syncNow();
        })
        .catch((error) => failPermission('reler a permissão', error));
    });
    return () => subscription.remove();
  }, [syncNow, failPermission]);

  // Saiu da conta: some com os avisos da conta anterior da central do aparelho.
  const wasLoggedIn = useRef(isLoggedIn);
  useEffect(() => {
    if (wasLoggedIn.current && !isLoggedIn) {
      Notifications.dismissAllNotificationsAsync().catch(() => undefined);
      setWasOffered(false);
    }
    wasLoggedIn.current = isLoggedIn;
  }, [isLoggedIn]);

  // ---- 3. toque -> deep link -----------------------------------------------
  useEffect(() => {
    // Chegou com o app aberto: só atualiza a lista do Perfil. Navegar aqui
    // jogaria a tela do produto na cara de quem estava fazendo outra coisa.
    const received = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.storeMessages.all });
    });

    let lastHandledId: string | null = null;
    function handleResponse(response: Notifications.NotificationResponse) {
      const id = response.notification.request.identifier;
      // No cold start o mesmo toque pode chegar pelos dois caminhos abaixo.
      if (id === lastHandledId) return;
      lastHandledId = id;
      // Limpa para que a PRÓXIMA abertura normal do app não reabra este produto.
      Notifications.clearLastNotificationResponse();

      const target = targetFromData(normalizeData(response.notification.request.content.data));
      // Se o app ainda está restaurando a sessão, o destino fica pendente
      // até o stack logado existir (ver navigation.ts).
      if (target) navigateFromOutside(target);
    }

    const tapped = Notifications.addNotificationResponseReceivedListener(handleResponse);

    // App FECHADO: o toque que abriu o app aconteceu antes deste listener
    // existir e nunca vai dispará-lo. Esta é a resposta "atrasada".
    const coldStartResponse = Notifications.getLastNotificationResponse();
    if (coldStartResponse) handleResponse(coldStartResponse);

    return () => {
      received.remove();
      tapped.remove();
    };
  }, [queryClient]);

  const value = useMemo<NotificationsValue>(
    () => ({
      permission,
      requestPermission,
      wasOffered,
      markOffered: () => setWasOffered(true),
      syncNow,
      refreshPermission,
      permissionError,
    }),
    [permission, requestPermission, wasOffered, syncNow, refreshPermission, permissionError],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsValue {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error('useNotifications precisa estar dentro de <NotificationsProvider>.');
  return context;
}
