/**
 * RF-49 — o toque com mola, num componente só.
 *
 * Sem feedback o usuário não sabe se o toque pegou e toca de novo; num botão
 * de comprar isso é pedido duplicado. A animação aqui é confirmação.
 *
 * Por que `useSharedValue` e não `useState(pressed)`: o shared value vive na
 * thread de UI. Mudar ele não re-renderiza a tela, e a mola roda a 60 fps
 * mesmo com a thread de JS ocupada buscando produtos.
 *
 * Os três modos (ver theme/motion.ts):
 *   full    -> encolhe com mola
 *   reduced -> não muda de tamanho; escurece (opacidade) com tempo curto
 *   off     -> escurece na hora, sem transição. O feedback continua.
 */
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { OPACITY, SCALE, SPRING, TIMING, useMotionMode } from '@/theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PressableScale({ children, style, onPressIn, onPressOut, ...rest }: Props) {
  const mode = useMotionMode();
  // 0 = solto, 1 = apertado. A tradução para escala/opacidade fica no estilo.
  const pressed = useSharedValue(0);
  // O estilo animado vem por último e venceria um `opacity` do estilo normal
  // (ex.: botão desabilitado). Partimos dele para não perder esse estado.
  const styleOpacity = StyleSheet.flatten(style)?.opacity;
  const baseOpacity = typeof styleOpacity === 'number' ? styleOpacity : 1;

  const animatedStyle = useAnimatedStyle(() => {
    if (mode === 'full') {
      return { transform: [{ scale: interpolate(pressed.value, [0, 1], [1, SCALE.pressed]) }] };
    }
    return { opacity: baseOpacity * interpolate(pressed.value, [0, 1], [1, OPACITY.pressed]) };
  });

  function animateTo(value: 0 | 1) {
    if (mode === 'full') pressed.value = withSpring(value, SPRING.press);
    else if (mode === 'reduced') pressed.value = withTiming(value, TIMING.fast);
    else pressed.value = value;
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        animateTo(1);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(0);
        onPressOut?.(event);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
