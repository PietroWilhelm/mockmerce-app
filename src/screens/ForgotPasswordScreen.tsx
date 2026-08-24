import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSession } from '@/session/session';
import { forgotPassword, resetPassword } from '@/services/auth';
import { Button, TextField } from '@/components/ui';
import type { AuthStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { signIn } = useSession();
  const [fase, setFase] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function pedirCodigo() {
    setBusy(true);
    setErro(null);
    try {
      await forgotPassword(email.trim());
      setAviso('Se o e-mail existir, enviamos um código. Confira o e-mail e digite abaixo.');
      setFase('code');
    } catch (e) {
      setErro((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  async function redefinir() {
    setBusy(true);
    setErro(null);
    try {
      await resetPassword(email.trim(), code.trim(), novaSenha);
      await signIn(email.trim(), novaSenha);
    } catch (e) {
      setErro((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <View style={styles.container}>
        <Text style={styles.title}>Esqueci minha senha</Text>

        {fase === 'email' ? (
          <>
            <Text style={styles.subtitle}>Informe seu e-mail para receber um código.</Text>
            <TextField
              placeholder="email"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            {erro && <Text style={styles.erro}>{erro}</Text>}
            <Button label={busy ? 'Enviando…' : 'Enviar código'} onPress={pedirCodigo} disabled={busy || !email} />
          </>
        ) : (
          <>
            {aviso && <Text style={styles.aviso}>{aviso}</Text>}
            <TextField
              placeholder="código (6 dígitos)"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
            />
            <TextField
              placeholder="nova senha (mín. 6 caracteres)"
              secureTextEntry
              value={novaSenha}
              onChangeText={setNovaSenha}
            />
            {erro && <Text style={styles.erro}>{erro}</Text>}
            <Button
              label={busy ? 'Redefinindo…' : 'Redefinir senha'}
              onPress={redefinir}
              disabled={busy || !code || novaSenha.length < 6}
            />
            <Button label="Reenviar código" variant="ghost" onPress={pedirCodigo} disabled={busy} />
          </>
        )}

        <Button label="Voltar ao login" variant="ghost" onPress={() => navigation.navigate('SignIn')} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 4 },
  aviso: { fontSize: 13, color: '#15803d', textAlign: 'center' },
  erro: { color: '#b91c1c', fontSize: 13, textAlign: 'center' },
});
