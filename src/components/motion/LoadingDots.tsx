/**
 * RF-53 — o sinal de vida do carregamento.
 *
 * Um texto parado "Carregando…" não diferencia "trabalhando" de "travou".
 * Três pontos na cor da loja, um depois do outro, fazem essa diferença.
 *
 * Diferente das outras animações, esta não responde a nada: é lenta, contínua
 * e discreta de propósito.
 *   full    -> os pontos pulam em sequência
 *   reduced -> os pontos não se mexem; acendem e apagam em sequência
 *   off     -> o ActivityIndicator nativo do sistema (que não é animação
 *              nossa e continua dizendo "estou trabalhando")
 */
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { DURATION, LOADING_BOUNCE, OPACITY, TIMING, useMotionMode, type MotionMode } from '@/theme/motion';
import { useTheme } from '@/theme/ThemeProvider';

const DOTS = [0, 1, 2];

function Dot({ index, mode, color }: { index: number; mode: MotionMode; color: string }) {
  // 0 = repouso, 1 = no alto (ou aceso). Cada ponto começa um terço de ciclo depois.
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      (index * DURATION.pulse * 2) / DOTS.length,
      withRepeat(withSequence(withTiming(1, TIMING.pulse), withTiming(0, TIMING.pulse)), -1),
    );
    // Animação infinita precisa parar quando o componente sai da tela.
    return () => cancelAnimation(progress);
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() =>
    mode === 'full'
      ? { transform: [{ translateY: -LOADING_BOUNCE * progress.value }] }
      : { opacity: OPACITY.pulseLow + (1 - OPACITY.pulseLow) * progress.value },
  );

  return <Animated.View style={[styles.dot, { backgroundColor: color }, animatedStyle]} />;
}

export function LoadingDots() {
  const mode = useMotionMode();
  const theme = useTheme();

  if (mode === 'off') return <ActivityIndicator color={theme.primary} />;

  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityLabel="Carregando">
      {DOTS.map((index) => (
        <Dot key={index} index={index} mode={mode} color={theme.primary} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, height: 10 + LOADING_BOUNCE, alignItems: 'flex-end' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
