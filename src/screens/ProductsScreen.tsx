import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/ProductCard';
import { ErrorState, Loading } from '@/components/ui';
import { AnimatedListItem } from '@/components/motion/AnimatedListItem';
import { PressableScale } from '@/components/motion/PressableScale';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/theme/theme';
import type { RootStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';
import { useSession } from '@/session/session';

type Props = NativeStackScreenProps<RootStackParamList, 'Products'>;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function ProductsScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error, refetch, isFetching } = useProducts({ search });
  const { customer } = useSession();
  const theme = useTheme();
  // Esta tela não tem o cabeçalho nativo: o bloco roxo vai até o topo, então
  // ele mesmo reserva o espaço da barra de status (notch incluso).
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const tabs: { label: string; onPress: () => void }[] = [
    { label: 'Favoritos', onPress: () => navigation.navigate('Favorites') },
    { label: 'Pedidos', onPress: () => navigation.navigate('Orders') },
    { label: 'Carrinho', onPress: () => navigation.navigate('Cart') },
    { label: 'Retirada', onPress: () => navigation.navigate('PickupPoints') },
  ];

  const firstName = customer?.name.trim().split(/\s+/)[0];

  return (
    <View style={styles.container}>
      {/* Ícones brancos sobre o roxo; as outras telas (fundo branco) voltam ao escuro. */}
      <StatusBar style={isFocused ? 'light' : 'dark'} />

      <View style={[styles.hero, { backgroundColor: theme.primary, paddingTop: insets.top + 12 }]}>
        <View style={styles.heroTop}>
          <View style={styles.heroTitles}>
            {firstName && <Text style={styles.greeting}>Olá, {firstName}</Text>}
            <Text style={styles.heroTitle}>{theme.storeName}</Text>
          </View>
          <PressableScale
            onPress={() => navigation.navigate('Profile')}
            style={styles.avatar}
            hitSlop={8}
            accessibilityLabel="Abrir perfil"
          >
            <Text style={[styles.avatarText, { color: theme.primary }]}>{customer ? initials(customer.name) : '?'}</Text>
          </PressableScale>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Buscar produto…"
          placeholderTextColor={colors.textSoft}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />

        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <PressableScale key={tab.label} onPress={tab.onPress} style={styles.tab}>
              <Text style={styles.tabText} numberOfLines={1}>
                {tab.label}
              </Text>
            </PressableScale>
          ))}
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
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => (
            // RF-51: entra escalonado, com teto no atraso (ver STAGGER em theme/motion.ts).
            <AnimatedListItem index={index}>
              <ProductCard
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { id: item.id, name: item.name })}
              />
            </AnimatedListItem>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  hero: { paddingHorizontal: 16, paddingBottom: 16, gap: 14, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heroTitles: { flex: 1 },
  greeting: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800' },
  search: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.text,
  },
  // Quatro abas do mesmo tamanho numa linha só: alinhadas com a busca acima.
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingVertical: 8,
  },
  tabText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  list: { padding: 12, gap: 10 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
