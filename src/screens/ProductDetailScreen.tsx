import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useProduct } from '@/hooks/useProduct';
import { useCartMutations } from '@/hooks/useCartMutations';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { useSession } from '@/session/session';
import { useTheme } from '@/theme/ThemeProvider';
import { money } from '@/lib/format';
import { Button, ErrorState, Loading } from '@/components/ui';
import { FavoriteButton } from '@/components/motion/FavoriteButton';
import { PressableScale } from '@/components/motion/PressableScale';
import { ReviewsSection } from '@/components/ReviewsSection';
import { Stars, formatRating } from '@/components/Stars';
import type { RootStackParamList } from '@/navigation';
import type { ApiError, ProductVariant } from '@/types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const { data: product, isLoading, isError, error, refetch } = useProduct(id);
  const { isLoggedIn } = useSession();
  const theme = useTheme();
  const { addItem } = useCartMutations();
  const { isFavorite, toggle } = useFavoriteToggle();

  const [variantId, setVariantId] = useState<string | null>(null);

  const selected: ProductVariant | undefined = useMemo(() => {
    if (!product) return undefined;
    return (
      product.variants.find((v) => v.id === variantId) ??
      product.variants.find((v) => v.isDefault) ??
      product.variants[0]
    );
  }, [product, variantId]);

  // Vindo de uma notificação, o título chega genérico ("Produto"): o payload
  // não traz o nome. Quando o detalhe carrega, o cabeçalho é corrigido.
  useEffect(() => {
    if (product && product.name !== route.params.name) navigation.setOptions({ title: product.name });
  }, [product, route.params.name, navigation]);

  if (isLoading) return <Loading label="Carregando produto…" />;
  if (isError || !product) return <ErrorState message={(error as ApiError)?.message ?? 'Falha'} onRetry={() => refetch()} />;

  const outOfStock = !selected || selected.stock <= 0;
  const isFavorited = isFavorite(selected?.id);

  function handleToggleFavorite() {
    if (!product || !selected) return;
    toggle({ variantId: selected.id, product: product.name, sku: selected.sku, price: selected.price });
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
        {isLoggedIn && <FavoriteButton active={isFavorited} onPress={handleToggleFavorite} disabled={!selected} size={28} />}
      </View>

      {/* RF-35: média e contagem vindas do próprio GET /products/:id. */}
      <View style={styles.ratingRow}>
        {product.rating.count > 0 ? (
          <>
            <Stars value={product.rating.average} />
            <Text style={styles.ratingText}>
              {formatRating(product.rating.average)} · {product.rating.count}{' '}
              {product.rating.count === 1 ? 'avaliação' : 'avaliações'}
            </Text>
          </>
        ) : (
          <Text style={styles.ratingText}>Ainda sem avaliações</Text>
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
                <PressableScale
                  key={v.id}
                  onPress={() => setVariantId(v.id)}
                  accessibilityState={{ selected: active }}
                  style={[styles.chip, active && styles.chipActive, v.stock <= 0 && styles.chipDisabled]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{v.label ?? v.sku}</Text>
                </PressableScale>
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

      <ReviewsSection
        product={product}
        onWriteReview={() => navigation.navigate('Review', { productId: product.id, productName: product.name })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, paddingBottom: 40 },
  hero: { width: '100%', height: 260, borderRadius: 14, backgroundColor: '#e5e7eb' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  name: { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingText: { fontSize: 13, color: '#6b7280' },
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
  },
  chipActive: { borderColor: '#111827', backgroundColor: '#111827' },
  chipText: { color: '#111827' },
  chipTextActive: { color: '#fff' },
  chipDisabled: { opacity: 0.4 },
  stock: { fontSize: 13, color: '#6b7280' },
  stockEmpty: { color: '#b45309', fontWeight: '600' },
  loginHint: { fontSize: 13, color: '#b45309' },
});