/**
 * RF-50 — a estrela de favoritar.
 *
 * Favoritar não navega, não abre alerta, não mostra mensagem: a ÚNICA prova
 * de que funcionou é a estrela mudar. Uma troca de cor instantânea some no
 * meio de uma lista, por isso o "pulo" ao salvar.
 *
 * O pulo reage a `active` (o estado do cache), e não ao dedo: se o servidor
 * recusar e o cache voltar atrás, a animação não terá mentido. Mas só depois
 * de um toque: quando a lista de favoritos termina de carregar, `active` também
 * vira true, e pular ali seria confirmar uma ação que ninguém fez. E só pula
 * ao SALVAR — remover dos favoritos não merece comemoração.
 *
 * Reduzido: em vez de crescer, a estrela "acende" (opacidade). Desligado: só
 * a troca de símbolo e cor. Nos três casos o feedback existe.
 */
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { PressableScale } from './PressableScale';
import { OPACITY, SCALE, SPRING, TIMING, useMotionMode } from '@/theme/motion';
import { colors } from '@/theme/theme';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
};

export function FavoriteButton({ active, onPress, disabled, size = 18 }: Props) {
  const theme = useTheme();
  const mode = useMotionMode();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  // Marca que a próxima mudança de `active` foi causada por um toque.
  const toggledByUser = useRef(false);

  useEffect(() => {
    if (!toggledByUser.current) return;
    toggledByUser.current = false;
    if (!active || mode === 'off') return;
    if (mode === 'full') {
      scale.value = withSequence(withTiming(SCALE.pop, TIMING.fast), withSpring(1, SPRING.pop));
    } else {
      opacity.value = withSequence(withTiming(OPACITY.flash, TIMING.fast), withTiming(1, TIMING.enter));
    }
  }, [active, mode, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <PressableScale
      onPress={() => {
        toggledByUser.current = true;
        onPress();
      }}
      disabled={disabled}
      // Uma estrela de 18 px é menor que o alvo confortável (~44 px).
      hitSlop={12}
      accessibilityLabel={active ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
      accessibilityState={{ selected: active, disabled }}
      style={styles.area}
    >
      <Animated.Text style={[styles.star, { fontSize: size }, active && { color: theme.primary }, animatedStyle]}>
        {active ? '★' : '☆'}
      </Animated.Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  area: { padding: 2, alignItems: 'center', justifyContent: 'center' },
  star: { color: colors.borderStrong },
});
