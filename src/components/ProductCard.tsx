import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { money } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { useProduct } from '@/hooks/useProduct';
import { useFavorites } from '@/hooks/useFavorites';
import { useFavoriteMutations } from '@/hooks/useFavoriteMutations';
import { useSession } from '@/session/session';
import type { ProductSummary } from '@/types/api';

export function ProductCard({ product, onPress }: { product: ProductSummary; onPress: () => void }) {
  const theme = useTheme();
  const { isLoggedIn } = useSession();
  const { data: favorites } = useFavorites();
  // Mesma query da tela de detalhe (queryKeys.products.detail) — cache compartilhado,
  // usada aqui só pra descobrir o id da variante padrão (a lista não traz variantId).
  const { data: detail } = useProduct(product.id);
  const { addToFavorites, removeFromFavorites } = useFavoriteMutations();

  const defaultVariant = detail?.variants.find((v) => v.isDefault) ?? detail?.variants[0];
  const isFavorited = !!defaultVariant && !!favorites?.some((f) => f.variantId === defaultVariant.id);
  const favoritePending = addToFavorites.isPending || removeFromFavorites.isPending;
  const outOfStock = product.stock <= 0;

  function handleToggleFavorite() {
    if (!defaultVariant) return;
    if (isFavorited) removeFromFavorites.mutate(defaultVariant.id);
    else addToFavorites.mutate(defaultVariant.id);
  }

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={styles.thumbWrap}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]} />
        )}
        {outOfStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Esgotado</Text>
          </View>
        )}
        {isLoggedIn && (
          <Pressable
            hitSlop={10}
            onPress={handleToggleFavorite}
            disabled={!defaultVariant || favoritePending}
            style={styles.starBtn}
          >
            <Text style={[styles.star, isFavorited && { color: theme.primary }]}>{isFavorited ? '★' : '☆'}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: theme.primary }]}>
            {product.priceFrom === product.priceTo
              ? money(product.priceFrom)
              : `${money(product.priceFrom)} – ${money(product.priceTo)}`}
          </Text>
          <Text style={[styles.stock, outOfStock && styles.stockEmpty]}>
            {outOfStock ? 'sem estoque' : `${product.stock} em estoque`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eef0f3',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardPressed: { opacity: 0.85 },
  thumbWrap: { position: 'relative' },
  thumb: { width: 84, height: 84, borderRadius: 12, backgroundColor: '#e5e7eb' },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  outOfStockBadge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17,24,39,0.75)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 3,
  },
  outOfStockText: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  starBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  star: { fontSize: 16, color: '#d1d5db' },
  cardBody: { flex: 1, justifyContent: 'center', gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  brand: { fontSize: 12, color: '#6b7280' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  price: { fontSize: 16, fontWeight: '800' },
  stock: { fontSize: 12, color: '#6b7280' },
  stockEmpty: { color: '#b45309' },
});
