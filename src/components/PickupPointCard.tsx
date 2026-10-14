import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from './motion/PressableScale';
import { formatDistance, formatPickupAddress } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, tint } from '@/theme/theme';
import type { PickupPoint } from '@/types/api';

type Props = {
  point: PickupPoint;
  selected?: boolean;
  onPress?: () => void;
};

export function PickupPointCard({ point, selected, onPress }: Props) {
  const theme = useTheme();
  const address = formatPickupAddress(point.address);
  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      accessibilityState={{ selected }}
      style={[styles.card, selected && { borderColor: theme.primary, backgroundColor: tint(theme.primary) }]}
    >
      <View style={styles.top}>
        <Text style={[styles.name, selected && { color: theme.primary }]}>
          {selected ? '✓ ' : ''}
          {point.name}
        </Text>
        {/* RF-44: sem posição a API manda null, e o selo de distância some. */}
        {point.distanceKm !== null && (
          <Text style={[styles.distance, { color: theme.primary, backgroundColor: tint(theme.primary) }]}>
            {formatDistance(point.distanceKm)}
          </Text>
        )}
      </View>
      {address ? <Text style={styles.address}>{address}</Text> : null}
      {point.hours ? <Text style={styles.hours}>{point.hours}</Text> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 12,
    gap: 3,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  distance: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  address: { fontSize: 13, color: colors.textBody },
  hours: { fontSize: 12, color: colors.textMuted },
});
