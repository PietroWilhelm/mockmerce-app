import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFavorites } from '@/hooks/useFavorites';
import { useFavoriteMutations } from '@/hooks/useFavoriteMutations';
import { money } from '@/lib/format';
import { Button, ErrorState, Loading } from '@/components/ui';
import type { ApiError } from '@/types/api';

export function FavoritesScreen() {
  const { data, isLoading, isError, error, refetch } = useFavorites();
  const { removeFromFavorites } = useFavoriteMutations();

  if (isLoading) return <Loading label="Carregando favoritos…" />;
  if (isError) return <ErrorState message={(error as ApiError).message} onRetry={() => refetch()} />;

  const favorites = data ?? [];

  return (
    <FlatList
      style={styles.container}
      data={favorites}
      keyExtractor={(item) => item.variantId}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Você ainda não favoritou nenhum produto.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardBody}>
            <Text style={styles.name} numberOfLines={2}>
              {item.product}
            </Text>
            <Text style={styles.sku}>{item.sku}</Text>
            <Text style={styles.price}>{money(item.price)}</Text>
          </View>
          <Button
            label="Remover"
            variant="ghost"
            onPress={() => removeFromFavorites.mutate(item.variantId)}
            disabled={removeFromFavorites.isPending}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { padding: 12, gap: 10, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  cardBody: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  sku: { fontSize: 12, color: '#6b7280' },
  price: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { color: '#6b7280', textAlign: 'center' },
});
