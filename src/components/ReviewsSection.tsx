/**
 * Avaliações dentro da tela do produto.
 *
 * Três blocos, três fontes de dado diferentes — de propósito:
 *   1. Resumo (média, contagem, barras) -> `product.rating`, que JÁ veio no
 *      GET /products/:id. Nenhuma requisição extra, nenhuma conta no app (RF-35).
 *   2. "Posso avaliar?"                  -> GET .../reviews/can-review (RF-37)
 *   3. A lista                           -> GET .../reviews, com os quatro
 *                                           estados de tela (RF-36)
 */
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ReviewCard } from './ReviewCard';
import { Stars, formatRating } from './Stars';
import { LoadingDots } from './motion/LoadingDots';
import { Button, Notice } from './ui';
import { useCanReview, useReviews } from '@/hooks/useReviews';
import { contentEntering, useMotionMode } from '@/theme/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/theme/theme';
import type { ApiError, CanReview, Product } from '@/types/api';

type Props = { product: Product; onWriteReview: () => void };

export function ReviewsSection({ product, onWriteReview }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Avaliações</Text>
      <RatingSummary rating={product.rating} />
      <CanReviewBlock productId={product.id} onWriteReview={onWriteReview} />
      <ReviewList productId={product.id} />
    </View>
  );
}

function RatingSummary({ rating }: { rating: Product['rating'] }) {
  const theme = useTheme();
  if (rating.count === 0) {
    return <Text style={styles.muted}>Este produto ainda não tem avaliações.</Text>;
  }
  return (
    <View style={styles.summary}>
      <View style={styles.summaryLeft}>
        <Text style={styles.average}>{formatRating(rating.average)}</Text>
        <Stars value={rating.average} />
        <Text style={styles.muted}>
          {rating.count} {rating.count === 1 ? 'avaliação' : 'avaliações'}
        </Text>
      </View>
      <View style={styles.bars}>
        {(['5', '4', '3', '2', '1'] as const).map((star) => {
          const amount = rating.distribution[star] ?? 0;
          return (
            <View key={star} style={styles.barRow}>
              <Text style={styles.barLabel}>{star}★</Text>
              <View style={styles.barTrack}>
                <View
                  style={[styles.barFill, { backgroundColor: theme.primary, width: `${(amount / rating.count) * 100}%` }]}
                />
              </View>
              <Text style={styles.barCount}>{amount}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Um texto PRÓPRIO para cada motivo — o "false" sozinho não diz nada ao cliente. */
function canReviewMessage(result: CanReview, myReviewIsHidden: boolean): { title: string; message: string } {
  if (result.reason === 'NOT_PURCHASED') {
    return {
      title: 'Avaliação liberada só para quem comprou',
      message: 'Assim que um pedido seu com este produto for pago, você pode contar aqui o que achou.',
    };
  }
  if (result.reason === 'ALREADY_REVIEWED') {
    return myReviewIsHidden
      ? {
          title: 'Você já avaliou este produto',
          message: 'A loja ocultou a sua avaliação, então ela não aparece para os outros clientes.',
        }
      : { title: 'Você já avaliou este produto', message: 'Obrigado por contar a sua experiência!' };
  }
  // Um motivo que este app ainda não conhece: a mensagem do servidor é melhor que nada.
  return { title: 'Avaliação indisponível', message: result.message };
}

function CanReviewBlock({ productId, onWriteReview }: { productId: string; onWriteReview: () => void }) {
  const { data, isPending, isError, refetch } = useCanReview(productId);
  const { data: reviews } = useReviews(productId);

  if (isPending) {
    return (
      <View style={styles.inline}>
        <LoadingDots />
        <Text style={styles.muted}>Verificando se você pode avaliar…</Text>
      </View>
    );
  }
  if (isError) {
    return (
      <Notice
        tone="warning"
        message="Não conseguimos verificar se você pode avaliar este produto."
        actionLabel="Tentar de novo"
        onAction={() => refetch()}
      />
    );
  }
  if (data.canReview) {
    return (
      <View style={styles.cta}>
        <Text style={styles.ctaText}>Você comprou este produto. Conte o que achou!</Text>
        <Button label="Avaliar produto" onPress={onWriteReview} />
      </View>
    );
  }
  const { title, message } = canReviewMessage(data, reviews?.mine?.hidden ?? false);
  return <Notice title={title} message={message} />;
}

function ReviewList({ productId }: { productId: string }) {
  const mode = useMotionMode();
  const { data, isPending, isError, error, refetch } = useReviews(productId);

  // 1. carregando
  if (isPending) {
    return (
      <View style={styles.inline}>
        <LoadingDots />
        <Text style={styles.muted}>Carregando avaliações…</Text>
      </View>
    );
  }
  // 2. erro — antes do "vazio": falha de rede não é "ninguém avaliou"
  if (isError) {
    return (
      <Notice
        tone="warning"
        title="Não foi possível carregar as avaliações"
        message={(error as ApiError).message}
        actionLabel="Tentar de novo"
        onAction={() => refetch()}
      />
    );
  }
  // 3. vazio
  if (data.visible.length === 0) {
    return <Text style={styles.muted}>Ninguém publicou uma avaliação ainda. Que tal ser o primeiro?</Text>;
  }
  // 4. conteúdo — a avaliação recém-enviada aparece com um fade (confirmação de que entrou)
  return (
    <View style={styles.list}>
      {data.visible.map((review) => (
        <Animated.View key={review.id} entering={contentEntering(mode)}>
          <ReviewCard review={review} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12, marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
  summary: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  summaryLeft: { alignItems: 'center', gap: 2, minWidth: 90 },
  average: { fontSize: 34, fontWeight: '800', color: colors.text },
  bars: { flex: 1, gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { width: 26, fontSize: 11, color: colors.textMuted },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  barCount: { width: 22, fontSize: 11, color: colors.textMuted, textAlign: 'right' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  cta: { gap: 8, backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 12 },
  ctaText: { fontSize: 13, color: colors.textBody },
  list: { gap: 10 },
});
