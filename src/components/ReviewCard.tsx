import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stars } from './Stars';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, tint } from '@/theme/theme';
import type { Review } from '@/types/api';

export function ReviewCard({ review }: { review: Review }) {
  const theme = useTheme();
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Stars value={review.rating} />
        <Text style={styles.date}>{new Date(review.createdAt).toLocaleDateString('pt-BR')}</Text>
      </View>

      {review.title && <Text style={styles.title}>{review.title}</Text>}
      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}

      {review.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
          {review.images.map((image) => (
            <Image key={image.id} source={{ uri: image.url }} style={styles.photo} />
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Text style={styles.author}>{review.isMine ? 'Você' : review.author.name}</Text>
        {review.verifiedPurchase && (
          <Text style={[styles.badge, { color: theme.primary, backgroundColor: tint(theme.primary) }]}>
            Compra verificada
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 12, gap: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 11, color: colors.textSoft },
  title: { fontSize: 14, fontWeight: '700', color: colors.text },
  comment: { fontSize: 13, color: colors.textBody, lineHeight: 19 },
  photos: { gap: 8 },
  photo: { width: 72, height: 72, borderRadius: 10, backgroundColor: colors.border },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  author: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  badge: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
});
