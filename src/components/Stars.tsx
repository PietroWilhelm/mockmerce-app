import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from './motion/PressableScale';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/theme/theme';

const VALUES = [1, 2, 3, 4, 5] as const;

/** Estrelas só de leitura, arredondadas para a estrela inteira mais próxima (o número exato vai ao lado). */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const theme = useTheme();
  const filled = Math.round(value);
  return (
    <Text
      style={{ fontSize: size, letterSpacing: 1 }}
      accessibilityLabel={`${formatRating(value)} de 5 estrelas`}
    >
      {VALUES.map((star) => (
        <Text key={star} style={{ color: star <= filled ? theme.primary : colors.border }}>
          ★
        </Text>
      ))}
    </Text>
  );
}

/** Seletor de nota do formulário: cada estrela responde ao toque com mola (RF-49). */
export function StarRatingInput({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.inputRow} accessibilityRole="adjustable" accessibilityLabel={`Nota: ${value || 'nenhuma'} de 5`}>
      {VALUES.map((star) => (
        <PressableScale
          key={star}
          onPress={() => onChange(star)}
          hitSlop={6}
          accessibilityLabel={`${star} estrela${star > 1 ? 's' : ''}`}
          accessibilityState={{ selected: star <= value }}
        >
          <Text style={[styles.inputStar, { color: star <= value ? theme.primary : colors.borderStrong }]}>★</Text>
        </PressableScale>
      ))}
    </View>
  );
}

export function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', gap: 6 },
  inputStar: { fontSize: 36 },
});
