import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCart } from '@/hooks/useCart';
import { useCheckout } from '@/hooks/useOrderActions';
import { Button, ErrorState, Loading } from '@/components/ui';
import { money } from '@/lib/format';
import type { RootStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

export function CheckoutScreen({ navigation, route }: Props) {
  const { data: cart, isLoading, isError, error, refetch } = useCart();
  const checkoutMutation = useCheckout();
  const shippingMethod = route.params?.shippingMethod;
  const shippingPrice = route.params?.shippingPrice ?? 0;

  if (isLoading) return <Loading label="Carregando carrinho…" />;
  if (isError) return <ErrorState message={(error as ApiError).message} onRetry={() => refetch()} />;

  const items = cart?.items ?? [];
  const productsTotal = cart?.total ?? 0;
  const totalWithShipping = productsTotal + shippingPrice;

  if (items.length === 0) {
    return <ErrorState message="Seu carrinho está vazio. Adicione produtos antes de finalizar." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.variantId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.qty}>
                {item.quantity} × {money(item.unitPrice)}
              </Text>
            </View>
            <Text style={styles.subtotal}>{money(item.subtotal)}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        {shippingMethod ? (
          <>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Produtos</Text>
              <Text style={styles.subValue}>{money(productsTotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Frete ({shippingMethod})</Text>
              <Text style={styles.subValue}>{money(shippingPrice)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{money(totalWithShipping)}</Text>
            </View>
            <Text style={styles.shippingNote}>
              O back-end da turma ainda não integra frete ao pagamento — o valor cobrado será só o dos
              produtos ({money(productsTotal)}).
            </Text>
          </>
        ) : (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{money(productsTotal)}</Text>
          </View>
        )}
        <Button
          label={checkoutMutation.isPending ? 'Criando pedido…' : 'Confirmar pedido'}
          disabled={checkoutMutation.isPending}
          onPress={() => {
            checkoutMutation.mutate(undefined, {
              onSuccess: (order) => {
                navigation.replace('Order', { id: order.id });
              },
              onError: (err) => {
                Alert.alert('Erro ao criar pedido', (err as ApiError).message ?? 'Tente novamente.');
              },
            });
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { padding: 12, gap: 10 },
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
  qty: { fontSize: 12, color: '#6b7280' },
  subtotal: { fontSize: 14, fontWeight: '700', color: '#111827' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15, color: '#6b7280' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  subValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  shippingNote: { fontSize: 11, color: '#b45309' },
});
