/**
 * RF-60: o Perfil explica o estado das notificações e como mudar.
 *
 * Um app que simplesmente nunca notifica, sem dizer por quê, parece quebrado.
 * Cada desfecho da permissão tem o seu texto e a sua ação.
 */
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from './ui';
import { useNotifications } from '@/notifications/NotificationsProvider';
import type { NotificationPermission } from '@/lib/notifications';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, tint } from '@/theme/theme';

const SETTINGS_PATH =
  Platform.OS === 'ios' ? 'Ajustes › Dr.Mouse › Notificações' : 'Configurações › Apps › Dr.Mouse › Notificações';

const COPY: Record<NotificationPermission, { title: string; message: string }> = {
  checking: { title: 'Verificando avisos…', message: '' },
  undetermined: {
    title: 'Avisos desligados',
    message: 'Ative para saber quando a loja baixar o preço ou lançar novidade. Nada muda na loja se você preferir não ativar.',
  },
  granted: {
    title: 'Avisos ligados',
    message: 'Quando a loja mandar um aviso, ele aparece na central de notificações. Tocar nele abre o produto.',
  },
  dismissed: {
    title: 'Avisos desligados',
    message: 'Você preferiu não ativar agora. A loja continua funcionando igual; os avisos ficam só aqui embaixo.',
  },
  denied: {
    title: 'Avisos bloqueados no aparelho',
    message: `A loja continua funcionando normalmente — você só não recebe notificações. Os avisos continuam aqui embaixo. Para reativar: ${SETTINGS_PATH}.`,
  },
  unavailable: {
    title: 'Não foi possível verificar os avisos',
    message: 'O aparelho não respondeu sobre a permissão de notificação. A loja continua funcionando, e os avisos continuam aqui embaixo.',
  },
};

export function NotificationsCard() {
  const theme = useTheme();
  const { permission, requestPermission, syncNow, refreshPermission, permissionError } = useNotifications();
  const copy = COPY[permission];
  const on = permission === 'granted';

  return (
    <View style={[styles.card, on ? { borderColor: theme.primary, backgroundColor: tint(theme.primary) } : styles.cardOff]}>
      <Text style={styles.title}>{copy.title}</Text>
      {copy.message ? <Text style={styles.message}>{copy.message}</Text> : null}

      {(permission === 'undetermined' || permission === 'dismissed') && (
        <Button label="Ativar avisos" onPress={() => void requestPermission()} />
      )}
      {permission === 'denied' && (
        <Button label="Abrir ajustes do aparelho" variant="ghost" onPress={() => void Linking.openSettings()} />
      )}
      {on && <Button label="Procurar avisos novos" variant="ghost" onPress={() => void syncNow()} />}
      {permission === 'unavailable' && (
        <>
          {/* Só em desenvolvimento: o motivo técnico, para não precisar adivinhar. */}
          {__DEV__ && permissionError && <Text style={styles.detail}>Detalhe: {permissionError}</Text>}
          <Button label="Tentar de novo" variant="ghost" onPress={() => void refreshPermission()} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  cardOff: { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  message: { fontSize: 13, color: colors.textBody, lineHeight: 19 },
  detail: { fontSize: 11, color: colors.textMuted, fontFamily: 'monospace' },
});
