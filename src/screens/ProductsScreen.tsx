import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/ProductCard';
import { ErrorState, Loading } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';
import { useSession } from '@/session/session';

type Props = NativeStackScreenProps<RootStackParamList, 'Products'>;

export function ProductsScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error, refetch, isFetching } = useProducts({ search });
  const { signOut } = useSession();
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.hero, { backgroundColor: theme.primary }]}>
        <View style={styles.heroTop}>
          <Text style={styles.heroTitle}>{theme.storeName}</Text>
          <Text style={styles.heroLink} onPress={signOut}>
            Sair
          </Text>
        </View>
        <TextInput
          style={styles.search}
          placeholder="Buscar produto…"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        <View style={styles.tabs}>
          <Text style={styles.tab} onPress={() => navigation.navigate('Favorites')}>
            ★ Favoritos
          </Text>
          <Text style={styles.tab} onPress={() => navigation.navigate('Orders')}>
            Pedidos
          </Text>
          <Text style={styles.tab} onPress={() => navigation.navigate('Cart')}>
            Carrinho
          </Text>
        </View>
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
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { id: item.id, name: item.name })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hero: { paddingTop: 8, paddingHorizontal: 16, paddingBottom: 16, gap: 12, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroLink: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  search: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  tabs: { flexDirection: 'row', gap: 18 },
  tab: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  list: { padding: 12, gap: 10 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
});