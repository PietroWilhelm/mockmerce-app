/**
 * RF-45: quando não dá para ordenar por distância, a tela DIZ por quê e dá um
 * caminho para tentar de novo. A lista nunca depende deste aviso para aparecer.
 */
import { Linking, StyleSheet, Text, View } from 'react-native';
import { LoadingDots } from './motion/LoadingDots';
import { Notice } from './ui';
import type { useLocation } from '@/hooks/useLocation';
import { colors } from '@/theme/theme';

type Location = ReturnType<typeof useLocation>;

const NO_POSITION_TEXT: Record<'services-off' | 'timeout' | 'error', string> = {
  'services-off': 'A localização do aparelho está desligada.',
  timeout: 'O GPS não respondeu a tempo (acontece dentro de prédios).',
  error: 'Não conseguimos ler a sua posição.',
};

export function LocationNotice({ location }: { location: Location }) {
  if (location.status === 'locating') {
    return (
      <View style={styles.locating}>
        <LoadingDots />
        <Text style={styles.locatingText}>Procurando sua posição para ordenar pelo mais perto…</Text>
      </View>
    );
  }

  if (location.status === 'denied') {
    return (
      <Notice
        title="Lista sem ordem de distância"
        message="Você não permitiu o acesso à localização, então mostramos os pontos na ordem da loja e sem a distância até você."
        actionLabel={location.mustOpenSettings ? 'Permitir nos ajustes do aparelho' : 'Permitir localização'}
        onAction={location.mustOpenSettings ? () => Linking.openSettings() : location.retry}
      />
    );
  }

  if (location.status === 'no-position') {
    const reason = location.noPositionReason ? NO_POSITION_TEXT[location.noPositionReason] : NO_POSITION_TEXT.error;
    return (
      <Notice
        title="Lista sem ordem de distância"
        message={`${reason} Os pontos aparecem na ordem da loja até a posição chegar.`}
        actionLabel="Tentar localizar de novo"
        onAction={location.retry}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  locating: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  locatingText: { flex: 1, fontSize: 12, color: colors.textMuted },
});
