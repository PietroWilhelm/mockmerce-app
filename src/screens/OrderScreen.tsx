import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useOrder, useOrderTimeline } from '@/hooks/useOrders';
import { useCancelOrder, usePayOrder } from '@/hooks/useOrderActions';
import { Button, ErrorState, Loading } from '@/components/ui';
import { money } from '@/lib/format';
import { statusColor, statusLabel } from '@/lib/orders';
import type { RootStackParamList } from '@/navigation';
import type { ApiError, OrderTimelineEvent } from '@/types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Order'>;

const METHODS: { label: string; value: 'CREDIT_CARD' | 'PIX' | 'BOLETO' }[] = [
  { label: 'Cartão de crédito', value: 'CREDIT_CARD' },
  { label: 'PIX', value: 'PIX' },
  { label: 'Boleto', value: 'BOLETO' },
];

function timelineLabel(event: OrderTimelineEvent): string {
  if (typeof event.message === 'string') return event.message;
  if (typeof event.type === 'string') return event.type;
  if (typeof event.status === 'string') return event.status;
  return 'Evento';
}

function timelineDate(event: OrderTimelineEvent): string | null {
  const raw = event.createdAt ?? event.date;
  return typeof raw === 'string' ? raw : null;
}

export function OrderScreen({ route }: Props) {
  const { id } = route.params;
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  const { data: timeline } = useOrderTimeline(id);
  const payOrderMutation = usePayOrder(id);
  const cancelOrderMutation = useCancelOrder(id);
  const [method, setMethod] = useState<'CREDIT_CARD' | 'PIX' | 'BOLETO'>('PIX');

  if (isLoading) return <Loading label="Carregando pedido…" />;
  if (isError || !order) {
    return <ErrorState message={(error as ApiError)?.message ?? 'Pedido não encontrado.'} onRetry={() => refetch()} />;
  }

  const isPending = order.status === 'PENDING';
  const paymentSettled = order.payment ? !['PENDING'].includes(order.payment.status) : false;
  const canPay = isPending && !paymentSettled;

  function pay(simulate: 'approve' | 'decline') {
    payOrderMutation.mutate(
      { method, simulate },
      { onError: (err) => Alert.alert('Erro no pagamento', (err as ApiError).message ?? 'Tente novamente.') },
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={order.items}
      keyExtractor={(item) => item.variantId}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <Text style={styles.orderId}>Pedido #{order.id.slice(0, 8)}</Text>
            <Text style={[styles.status, { color: statusColor(order.status) }]}>{statusLabel(order.status)}</Text>
          </View>

          {order.payment && (
            <View style={styles.paymentBox}>
              <Text style={styles.sectionTitle}>Pagamento</Text>
              <Text style={[styles.status, { color: statusColor(order.payment.status) }]}>
                {statusLabel(order.payment.status)} · {order.payment.method}
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Itens</Text>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.rowBody}>
            <Text style={styles.name} numberOfLines={2}>
              {item.productName}
            </Text>
            {item.variantName && <Text style={styles.variant}>{item.variantName}</Text>}
            <Text style={styles.qty}>
              {item.quantity} × {money(item.unitPrice)}
            </Text>
          </View>
          <Text style={styles.subtotal}>{money(item.subtotal)}</Text>
        </View>
      )}
      ListFooterComponent={
        <>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{money(order.total)}</Text>
          </View>

          {canPay && (
            <View style={styles.payBox}>
              <Text style={styles.sectionTitle}>Forma de pagamento</Text>
              <View style={styles.methodRow}>
                {METHODS.map((m) => (
                  <Text
                    key={m.value}
                    onPress={() => setMethod(m.value)}
                    style={[styles.chip, method === m.value && styles.chipActive]}
                  >
                    {m.label}
                  </Text>
                ))}
              </View>
              <Button
                label={payOrderMutation.isPending ? 'Processando…' : 'Pagar agora'}
                disabled={payOrderMutation.isPending}
                onPress={() => pay('approve')}
              />
              <Button
                label="Simular recusa"
                variant="ghost"
                disabled={payOrderMutation.isPending}
                onPress={() => pay('decline')}
              />
              <Button
                label={cancelOrderMutation.isPending ? 'Cancelando…' : 'Cancelar pedido'}
                variant="ghost"
                disabled={cancelOrderMutation.isPending}
                onPress={() =>
                  cancelOrderMutation.mutate(undefined, {
                    onError: (err) => Alert.alert('Erro', (err as ApiError).message ?? 'Tente novamente.'),
                  })
                }
              />
            </View>
          )}

          {timeline && timeline.length > 0 && (
            <View style={styles.timelineBox}>
              <Text style={styles.sectionTitle}>Linha do tempo</Text>
              {timeline.map((event, index) => {
                const date = timelineDate(event);
                return (
                  <View key={index} style={styles.timelineRow}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineBody}>
                      <Text style={styles.timelineLabel}>{timelineLabel(event)}</Text>
                      {date && <Text style={styles.timelineDate}>{new Date(date).toLocaleString('pt-BR')}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { padding: 16, paddingBottom: 32, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 16, fontWeight: '700', color: '#111827' },
  status: { fontSize: 13, fontWeight: '700' },
  paymentBox: { gap: 4, marginBottom: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginTop: 8, marginBottom: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  rowBody: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827' },
  variant: { fontSize: 12, color: '#6b7280' },
  qty: { fontSize: 12, color: '#6b7280' },
  subtotal: { fontSize: 14, fontWeight: '700', color: '#111827' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  totalLabel: { fontSize: 15, color: '#6b7280' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  payBox: { gap: 10, marginTop: 16 },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
    color: '#111827',
    fontSize: 13,
  },
  chipActive: { borderColor: '#111827', backgroundColor: '#111827', color: '#fff' },
  timelineBox: { marginTop: 20, gap: 10 },
  timelineRow: { flexDirection: 'row', gap: 10 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#111827', marginTop: 5 },
  timelineBody: { flex: 1 },
  timelineLabel: { fontSize: 13, color: '#111827', fontWeight: '600' },
  timelineDate: { fontSize: 11, color: '#9ca3af' },
});
