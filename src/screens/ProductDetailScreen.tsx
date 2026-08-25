import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProduct } from '@/hooks/useProduct';
import { useCartMutations } from '@/hooks/useCartMutations';
import { useFavorites } from '@/hooks/useFavorites';
import { useFavoriteMutations } from '@/hooks/useFavoriteMutations';
import { useSession } from '@/session/session';
import { useTheme } from '@/theme/ThemeProvider';
import { money } from '@/lib/format';
import { Button, ErrorState, Loading } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError, ProductVariant } from '@/types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { data: product, isLoading, isError, error, refetch } = useProduct(id);
  const { isLoggedIn } = useSession();
  const theme = useTheme();
  const { addItem } = useCartMutations();
  const { data: favorites } = useFavorites();
  const { addToFavorites, removeFromFavorites } = useFavoriteMutations();

  const [variantId, setVariantId] = useState<string | null>(null);

  const selected: ProductVariant | undefined = useMemo(() => {
    if (!product) return undefined;
    return (
      product.variants.find((v) => v.id === variantId) ??
      product.variants.find((v) => v.isDefault) ??
      product.variants[0]
    );
  }, [product, variantId]);

  if (isLoading) return <Loading label="Carregando produto…" />;
  if (isError || !product) return <ErrorState message={(error as ApiError)?.message ?? 'Falha'} onRetry={() => refetch()} />;

  const outOfStock = !selected || selected.stock <= 0;
  const isFavorited = !!selected && !!favorites?.some((f) => f.variantId === selected.id);
  const favoritePending = addToFavorites.isPending || removeFromFavorites.isPending;

  function handleToggleFavorite() {
    if (!selected) return;
    if (isFavorited) {
      removeFromFavorites.mutate(selected.id);
    } else {
      addToFavorites.mutate(selected.id);
    }
  }

  function handleAdd() {
    if (!product || !selected) return;
    addItem.mutate(
      {
        variantId: selected.id,
        quantity: 1,
        name: selected.label ? `${product.name} (${selected.label})` : product.name,
        unitPrice: selected.price,
      },
      { onSuccess: () => navigation.navigate('Cart') },
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {product.images[0] && <Image source={{ uri: product.images[0].url }} style={styles.hero} />}

      <View style={styles.titleRow}>
        <Text style={styles.name}>{product.name}</Text>
        {isLoggedIn && (
          <Pressable hitSlop={10} onPress={handleToggleFavorite} disabled={!selected || favoritePending}>
            <Text style={[styles.starLarge, isFavorited && { color: theme.primary }]}>
              {isFavorited ? '★' : '☆'}
            </Text>
          </Pressable>
        )}
      </View>

      {selected && (
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: theme.primary }]}>{money(selected.price)}</Text>
          <Text style={[styles.stock, outOfStock && styles.stockEmpty]}>
            {outOfStock ? 'sem estoque' : `${selected.stock} em estoque`}
          </Text>
        </View>
      )}

      {product.description && <Text style={styles.desc}>{product.description}</Text>}

      {/* Produto VARIABLE: deixa escolher a variante. SIMPLE já usa a única. */}
      {product.type === 'VARIABLE' && (
        <View style={styles.variants}>
          <Text style={styles.label}>Opções</Text>
          <View style={styles.variantRow}>
            {product.variants.map((v) => {
              const active = v.id === selected?.id;
              return (
                <Text
                  key={v.id}
                  onPress={() => setVariantId(v.id)}
                  style={[styles.chip, active && styles.chipActive, v.stock <= 0 && styles.chipDisabled]}
                >
                  {v.label ?? v.sku}
                </Text>
              );
            })}
          </View>
        </View>
      )}

      {!isLoggedIn && (
        <Text style={styles.loginHint}>Você precisa estar logado para comprar (veja a tela do carrinho).</Text>
      )}

      <Button
        label={addItem.isPending ? 'Adicionando…' : 'Adicionar ao carrinho'}
        onPress={handleAdd}
        disabled={outOfStock || !isLoggedIn || addItem.isPending}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  hero: { width: '100%', height: 260, borderRadius: 14, backgroundColor: '#e5e7eb' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  name: { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827' },
  starLarge: { fontSize: 26, color: '#d1d5db', marginTop: -2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  price: { fontSize: 22, fontWeight: '800' },
  desc: { fontSize: 14, color: '#374151', lineHeight: 20 },
  variants: { gap: 6, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
    color: '#111827',
  },
  chipActive: { borderColor: '#111827', backgroundColor: '#111827', color: '#fff' },
  chipDisabled: { opacity: 0.4 },
  stock: { fontSize: 13, color: '#6b7280' },
  stockEmpty: { color: '#b45309', fontWeight: '600' },
  loginHint: { fontSize: 13, color: '#b45309' },
});