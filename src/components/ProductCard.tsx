import { Image, StyleSheet, Text, View } from 'react-native';
import { money } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/theme/theme';
import { useProduct } from '@/hooks/useProduct';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { useSession } from '@/session/session';
import { PressableScale } from './motion/PressableScale';
import { FavoriteButton } from './motion/FavoriteButton';
import { formatRating } from './Stars';
import type { ProductSummary } from '@/types/api';

export function ProductCard({ product, onPress }: { product: ProductSummary; onPress: () => void }) {
  const theme = useTheme();
  const { isLoggedIn } = useSession();
  // Mesma query da tela de detalhe (queryKeys.products.detail) — cache compartilhado,
  // usada aqui só pra descobrir o id da variante padrão (a lista não traz variantId).
  const { data: detail } = useProduct(product.id);
  const { isFavorite, toggle } = useFavoriteToggle();

  const defaultVariant = detail?.variants.find((v) => v.isDefault) ?? detail?.variants[0];
  const isFavorited = isFavorite(defaultVariant?.id);
  const outOfStock = product.stock <= 0;

  function handleToggleFavorite() {
    if (!defaultVariant) return;
    toggle({ variantId: defaultVariant.id, product: product.name, sku: defaultVariant.sku, price: defaultVariant.price });
  }

  return (
    <PressableScale style={styles.card} onPress={onPress} accessibilityLabel={product.name}>
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
          <View style={styles.starBtn}>
            <FavoriteButton active={isFavorited} onPress={handleToggleFavorite} disabled={!defaultVariant} size={16} />
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
        {/* RF-35: a nota vem no próprio resumo do produto — nenhuma requisição a mais por card. */}
        <Text style={styles.rating}>
          {product.rating.count > 0 ? (
            <>
              <Text style={{ color: theme.primary }}>★ </Text>
              {formatRating(product.rating.average)} ({product.rating.count})
            </>
          ) : (
            'Sem avaliações'
          )}
        </Text>
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
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
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
  thumbWrap: { position: 'relative' },
  thumb: { width: 84, height: 84, borderRadius: 12, backgroundColor: colors.border },
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardBody: { flex: 1, justifyContent: 'center', gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  brand: { fontSize: 12, color: colors.textMuted },
  rating: { fontSize: 12, color: colors.textMuted },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  price: { fontSize: 16, fontWeight: '800' },
  stock: { fontSize: 12, color: colors.textMuted },
  stockEmpty: { color: colors.warning },
});
