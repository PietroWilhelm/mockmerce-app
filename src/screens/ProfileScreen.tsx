import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSession } from '@/session/session';
import { useStoreMessages } from '@/hooks/useStoreMessages';
import { NotificationsCard } from '@/components/NotificationsCard';
import { PressableScale } from '@/components/motion/PressableScale';
import { LoadingDots } from '@/components/motion/LoadingDots';
import { Button } from '@/components/ui';
import { normalizeData, targetFromData } from '@/lib/notifications';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/theme/theme';
import type { RootStackParamList } from '@/navigation';
import type { StoreMessage } from '@/types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function ProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const { customer, signOut } = useSession();
  const messages = useStoreMessages();

  // No logout, `customer` vira null um frame antes de o stack trocar.
  if (!customer) return null;

  /** Mesmo deep link da notificação, para quem prefere (ou precisa) ler aqui. */
  function openMessage(message: StoreMessage) {
    const target = targetFromData(normalizeData(message.data));
    if (target?.screen === 'ProductDetail') navigation.navigate('ProductDetail', target.params);
    else if (target) navigation.navigate(target.screen);
  }

  const links: { label: string; onPress: () => void }[] = [
    { label: 'Meus pedidos', onPress: () => navigation.navigate('Orders') },
    { label: '★ Favoritos', onPress: () => navigation.navigate('Favorites') },
    { label: 'Onde retirar', onPress: () => navigation.navigate('PickupPoints') },
    { label: 'Carrinho', onPress: () => navigation.navigate('Cart') },
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={styles.avatarText}>{initials(customer.name)}</Text>
        </View>
        <Text style={styles.name}>{customer.name}</Text>
        <Text style={styles.email}>{customer.email}</Text>
      </View>

      <View style={styles.links}>
        {links.map((link) => (
          <PressableScale key={link.label} onPress={link.onPress} style={[styles.link, { borderColor: theme.primary }]}>
            <Text style={[styles.linkText, { color: theme.primary }]}>{link.label}</Text>
          </PressableScale>
        ))}
      </View>

      <NotificationsCard />

      <View style={styles.inbox}>
        <Text style={styles.sectionTitle}>Últimos avisos da loja</Text>
        {messages.isPending ? (
          <LoadingDots />
        ) : messages.isError ? (
          <Text style={styles.muted}>Não foi possível carregar os avisos agora.</Text>
        ) : messages.data.length === 0 ? (
          <Text style={styles.muted}>A loja ainda não mandou nenhum aviso.</Text>
        ) : (
          messages.data.map((message) => {
            const hasTarget = targetFromData(normalizeData(message.data)) !== null;
            return (
              <PressableScale
                key={message.id}
                onPress={hasTarget ? () => openMessage(message) : undefined}
                disabled={!hasTarget}
                style={styles.message}
              >
                <Text style={styles.messageTitle}>{message.title}</Text>
                {message.body ? <Text style={styles.messageBody}>{message.body}</Text> : null}
                <Text style={styles.messageDate}>
                  {new Date(message.createdAt).toLocaleString('pt-BR')}
                  {hasTarget ? ' · toque para abrir' : ''}
                </Text>
              </PressableScale>
            );
          })
        )}
      </View>

      <Button label="Sair da conta" variant="ghost" onPress={signOut} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  identity: { alignItems: 'center', gap: 4 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  name: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: 6 },
  email: { fontSize: 13, color: colors.textMuted },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  link: { borderWidth: 1.5, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  linkText: { fontSize: 13, fontWeight: '700' },
  inbox: { gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
  message: { backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 12, gap: 3 },
  messageTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  messageBody: { fontSize: 13, color: colors.textBody },
  messageDate: { fontSize: 11, color: colors.textSoft },
});
