import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, tint } from '@/theme/theme';
import { PressableScale } from './motion/PressableScale';
import { LoadingDots } from './motion/LoadingDots';

export function TextField(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.textSoft} style={styles.input} {...props} />;
}

export function Center({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <Center>
      <LoadingDots />
      <Text style={styles.muted}>{label}</Text>
    </Center>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Center>
      <Text style={styles.errorTitle}>Algo deu errado</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry && <Button label="Tentar de novo" onPress={onRetry} />}
    </Center>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <Center>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message && <Text style={styles.muted}>{message}</Text>}
    </Center>
  );
}

/**
 * Faixa de aviso dentro de uma tela que CONTINUA funcionando: permissão
 * negada, GPS sem resposta, foto que não subiu. Diz o que aconteceu, o que
 * foi perdido e (quando dá) o caminho para resolver.
 */
export function Notice({
  title,
  message,
  actionLabel,
  onAction,
  tone = 'info',
}: {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'info' | 'warning';
}) {
  const theme = useTheme();
  const isWarning = tone === 'warning';
  return (
    <View
      style={[
        styles.notice,
        isWarning
          ? { backgroundColor: colors.warningBg, borderColor: '#fcd34d' }
          : { backgroundColor: tint(theme.primary), borderColor: tint(theme.primary, '40') },
      ]}
    >
      {title && <Text style={[styles.noticeTitle, isWarning && { color: colors.warning }]}>{title}</Text>}
      <Text style={styles.noticeText}>{message}</Text>
      {actionLabel && onAction && (
        <PressableScale onPress={onAction} style={styles.noticeAction} hitSlop={8}>
          <Text style={[styles.noticeActionText, { color: isWarning ? colors.warning : theme.primary }]}>
            {actionLabel}
          </Text>
        </PressableScale>
      )}
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled }}
      style={[
        styles.btn,
        variant === 'primary' && { backgroundColor: theme.primary },
        variant === 'ghost' && [styles.btnGhost, { borderColor: theme.primary }],
        disabled && styles.btnDim,
      ]}
    >
      <Text style={[styles.btnText, variant === 'ghost' && { color: theme.primary }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  muted: { color: colors.textMuted, textAlign: 'center' },
  errorTitle: { fontSize: 16, fontWeight: '700', color: colors.danger },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text, textAlign: 'center' },
  btn: {
    backgroundColor: colors.text,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1 },
  btnDim: { opacity: 0.55 },
  btnText: { color: '#fff', fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  notice: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  noticeTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  noticeText: { fontSize: 13, color: colors.textBody, lineHeight: 18 },
  noticeAction: { alignSelf: 'flex-start', marginTop: 4 },
  noticeActionText: { fontSize: 13, fontWeight: '700' },
});
