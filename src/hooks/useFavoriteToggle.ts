import { Alert } from 'react-native';
import { useFavorites } from './useFavorites';
import { useFavoriteMutations } from './useFavoriteMutations';
import { useNotifications } from '@/notifications/NotificationsProvider';
import type { FavoriteItem } from '@/types/api';

/**
 * Favoritar/desfavoritar, usado pelo card da lista e pelo detalhe.
 *
 * Também é aqui que mora o "momento certo" da permissão de notificação
 * (RF-56): logo depois do PRIMEIRO favorito, quando a pessoa acabou de dizer
 * "me importo com este produto". Antes disso, um pedido de permissão na
 * abertura do app seria só um "Permitir?" sem contexto — e quem recusa ali
 * não vê o diálogo do sistema nunca mais.
 */
export function useFavoriteToggle() {
  const { data: favorites } = useFavorites();
  const { addToFavorites, removeFromFavorites } = useFavoriteMutations();
  const notifications = useNotifications();

  function isFavorite(variantId: string | undefined): boolean {
    return !!variantId && !!favorites?.some((favorite) => favorite.variantId === variantId);
  }

  function offerPriceAlerts() {
    if (notifications.permission !== 'undetermined' || notifications.wasOffered) return;
    notifications.markOffered();
    Alert.alert(
      'Quer saber quando o preço cair?',
      'Ative os avisos e o Dr.Mouse te conta quando a loja baixar o preço ou lançar novidade. Dá para mudar depois no Perfil.',
      [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Ativar avisos', onPress: () => void notifications.requestPermission() },
      ],
    );
  }

  function toggle(item: FavoriteItem) {
    if (isFavorite(item.variantId)) {
      removeFromFavorites.mutate(item.variantId);
      return;
    }
    addToFavorites.mutate(item, { onSuccess: offerPriceAlerts });
  }

  return { isFavorite, toggle };
}
