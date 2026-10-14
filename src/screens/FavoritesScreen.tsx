import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFavorites } from '@/hooks/useFavorites';
import { useFavoriteMutations } from '@/hooks/useFavoriteMutations';
import { money } from '@/lib/format';
import { Button, EmptyState, ErrorState, Loading } from '@/components/ui';
import { AnimatedListItem } from '@/components/motion/AnimatedListItem';
import { listItemLayout, useMotionMode } from '@/theme/motion';
import { colors } from '@/theme/theme';
import type { ApiError } from '@/types/api';

export function FavoritesScreen() {
  const mode = useMotionMode();
  const { data, isLoading, isError, error, refetch } = useFavorites();
  const { removeFromFavorites } = useFavoriteMutations();

  if (isLoading) return <Loading label="Carregando favoritos…" />;
  if (isError) return <ErrorState message={(error as ApiError).message} onRetry={() => refetch()} />;

  const favorites = data ?? [];

  if (favorites.length === 0) {
    return (
      <EmptyState
        title="Nenhum favorito ainda"
        message="Toque na estrela de um produto para guardar aqui."
      />
    );
  }

  return (
    // RF-52: remover é otimista, então o item sai na hora (animado) e os
    // que ficam sobem com mola — `itemLayoutAnimation` move a CÉLULA da lista.
    <Animated.FlatList
      style={styles.container}
      data={favorites}
      keyExtractor={(item) => item.variantId}
      contentContainerStyle={styles.list}
      itemLayoutAnimation={listItemLayout(mode)}
      renderItem={({ item }) => (
        <AnimatedListItem animateExit style={styles.card}>
          <View style={styles.cardBody}>
            <Text style={styles.name} numberOfLines={2}>
              {item.product}
            </Text>
            <Text style={styles.sku}>{item.sku}</Text>
            <Text style={styles.price}>{money(item.price)}</Text>
          </View>
          <Button label="Remover" variant="ghost" onPress={() => removeFromFavorites.mutate(item.variantId)} />
        </AnimatedListItem>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  list: { padding: 12, gap: 10, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
  },
  cardBody: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  sku: { fontSize: 12, color: colors.textMuted },
  price: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 },
});
