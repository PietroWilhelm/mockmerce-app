import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

export function TextField(props: TextInputProps) {
  return <TextInput placeholderTextColor="#9ca3af" style={styles.input} {...props} />;
}

export function Center({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <Center>
      <ActivityIndicator size="large" />
      <Text style={styles.muted}>{label}</Text>
    </Center>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Center>
      <Text style={styles.errorTitle}>Algo deu errado</Text>
      <Text style={styles.muted}>{message}</Text>
      {onRetry && (
        <Button label="Tentar de novo" onPress={onRetry} />
      )}
    </Center>
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
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && { backgroundColor: theme.primary },
        variant === 'ghost' && [styles.btnGhost, { borderColor: theme.primary }],
        (disabled || pressed) && styles.btnDim,
      ]}
    >
      <Text style={[styles.btnText, variant === 'ghost' && { color: theme.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  muted: { color: '#6b7280', textAlign: 'center' },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#b91c1c' },
  btn: {
    backgroundColor: '#111827',
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
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
});
