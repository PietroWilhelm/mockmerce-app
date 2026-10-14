import { useQuery } from '@tanstack/react-query';
import { listStoreMessages } from '@/services/storeMessages';
import { queryKeys } from '@/lib/queryKeys';
import { isPresentable } from '@/lib/notifications';
import { useSession } from '@/session/session';

/**
 * Os avisos da loja como LISTA dentro do app (Perfil). É o que garante que
 * quem negou a notificação não perde o conteúdo — só o alerta do sistema.
 */
export function useStoreMessages() {
  const { isLoggedIn } = useSession();
  return useQuery({
    queryKey: queryKeys.storeMessages.all,
    queryFn: () => listStoreMessages(),
    enabled: isLoggedIn,
    select: (response) =>
      response.data
        .filter(isPresentable)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
  });
}
