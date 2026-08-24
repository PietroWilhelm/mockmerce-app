import { useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProducts } from '@/hooks/useProducts';
import { money } from '@/lib/format';
import { Button, ErrorState, Loading } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Products'>;

export function ProductsScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error, refetch, isFetching } = useProducts({ search });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.search}
          placeholder="Buscar produto…"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        <Button label="Pedidos" variant="ghost" onPress={() => navigation.navigate('Orders')} />
        <Button label="Carrinho" variant="ghost" onPress={() => navigation.navigate('Cart')} />
      </View>

      {isLoading ? (
        <Loading label="Buscando produtos…" />
      ) : isError ? (
        <ErrorState message={(error as ApiError).message} onRetry={() => refetch()} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => refetch()} />}
          ListEmptyComponent={<Text style={styles.empty}>Nenhum produto encontrado.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('ProductDetail', { id: item.id, name: item.name })}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbEmpty]} />
              )}
              <View style={styles.cardBody}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.brand && <Text style={styles.brand}>{item.brand}</Text>}
                <Text style={styles.price}>
                  {item.priceFrom === item.priceTo
                    ? money(item.priceFrom)
                    : `${money(item.priceFrom)} – ${money(item.priceTo)}`}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', gap: 8, padding: 12, alignItems: 'center' },
  search: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  list: { paddingHorizontal: 12, paddingBottom: 24, gap: 10 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: '#f9fafb', borderRadius: 12, padding: 10 },
  thumb: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#e5e7eb' },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, justifyContent: 'center', gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  brand: { fontSize: 12, color: '#6b7280' },
  price: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 2 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
});