import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useOrders } from '@/hooks/useOrders';
import { ErrorState, Loading } from '@/components/ui';
import { money } from '@/lib/format';
import { statusColor, statusLabel } from '@/lib/orders';
import type { RootStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Orders'>;

export function OrdersScreen({ navigation }: Props) {
  const { data: orders, isLoading, isError, error, refetch } = useOrders();

  if (isLoading) return <Loading label="Carregando pedidos…" />;
  if (isError) return <ErrorState message={(error as ApiError).message} onRetry={() => refetch()} />;

  return (
    <FlatList
      data={orders ?? []}
      keyExtractor={(order) => order.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>Você ainda não fez nenhum pedido.</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => navigation.navigate('Order', { id: item.id })}>
          <View style={styles.cardBody}>
            <Text style={styles.orderId}>Pedido #{item.id.slice(0, 8)}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.total}>{money(item.total)}</Text>
            <Text style={[styles.status, { color: statusColor(item.status) }]}>{statusLabel(item.status)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, gap: 10, flexGrow: 1 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
  },
  cardBody: { gap: 2 },
  orderId: { fontSize: 14, fontWeight: '600', color: '#111827' },
  date: { fontSize: 12, color: '#6b7280' },
  cardRight: { alignItems: 'flex-end', gap: 2 },
  total: { fontSize: 15, fontWeight: '700', color: '#111827' },
  status: { fontSize: 12, fontWeight: '600' },
});
