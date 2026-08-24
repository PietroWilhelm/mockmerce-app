import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCart } from '@/hooks/useCart';
import { useCartMutations } from '@/hooks/useCartMutations';
import { useShippingQuote } from '@/hooks/useShipping';
import { useSession } from '@/session/session';
import { useTheme } from '@/theme/ThemeProvider';
import { money } from '@/lib/format';
import { Button, ErrorState, Loading, TextField } from '@/components/ui';
import type { RootStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const { data: cart, isLoading, isError, error, refetch } = useCart();
  const { setQuantity, removeItem } = useCartMutations();
  const { customer, signOut } = useSession();
  const theme = useTheme();
  const [cep, setCep] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const shippingQuote = useShippingQuote();

  if (isLoading) return <Loading label="Carregando carrinho…" />;
  if (isError) return <ErrorState message={(error as ApiError).message} onRetry={() => refetch()} />;

  const items = cart?.items ?? [];
  const selectedOption = shippingQuote.data?.find((option) => option.method === selectedMethod) ?? null;
  const totalWithShipping = (cart?.total ?? 0) + (selectedOption?.price ?? 0);

  function calculateShipping() {
    if (!cep.trim()) return;
    setSelectedMethod(null);
    shippingQuote.mutate(cep.trim());
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(it) => it.variantId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.hi}>
            Olá, {customer?.name}. {items.length ? '' : 'Seu carrinho está vazio.'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.sub}>
                {money(item.unitPrice)} · subtotal {money(item.subtotal)}
              </Text>
            </View>
            <View style={styles.qtyBox}>
              {}
              <Text
                style={styles.qtyBtn}
                onPress={() => setQuantity.mutate({ variantId: item.variantId, quantity: item.quantity - 1 })}
              >
                −
              </Text>
              <Text style={styles.qty}>{item.quantity}</Text>
              <Text
                style={styles.qtyBtn}
                onPress={() => setQuantity.mutate({ variantId: item.variantId, quantity: item.quantity + 1 })}
              >
                +
              </Text>
            </View>
            <Text style={styles.remove} onPress={() => removeItem.mutate(item.variantId)}>
              remover
            </Text>
          </View>
        )}
        ListFooterComponent={
          items.length ? (
            <View style={styles.footer}>
              <View style={styles.shipping}>
                <Text style={styles.shippingTitle}>Calcular frete</Text>
                <View style={styles.shippingRow}>
                  <View style={styles.shippingInput}>
                    <TextField
                      placeholder="CEP"
                      keyboardType="numeric"
                      value={cep}
                      onChangeText={setCep}
                    />
                  </View>
                  <Button
                    label={shippingQuote.isPending ? 'Calculando…' : 'Calcular'}
                    disabled={shippingQuote.isPending}
                    onPress={calculateShipping}
                  />
                </View>
                {shippingQuote.isError && (
                  <Text style={styles.shippingError}>
                    {(shippingQuote.error as ApiError).message ?? 'Não foi possível cotar o frete.'}
                  </Text>
                )}
                {shippingQuote.data?.map((option) => {
                  const active = option.method === selectedMethod;
                  return (
                    <Pressable
                      key={option.method}
                      onPress={() => setSelectedMethod(active ? null : option.method)}
                      style={[styles.shippingOption, active && { borderColor: theme.primary, borderWidth: 2 }]}
                    >
                      <Text style={[styles.shippingMethod, active && { color: theme.primary }]}>
                        {active ? '✓ ' : ''}
                        {option.method}
                      </Text>
                      <Text style={styles.shippingDetail}>
                        {money(option.price)} · {option.deadlineDays} dia(s)
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {selectedOption ? (
                <>
                  <Text style={styles.subtotalLine}>Produtos: {money(cart?.total ?? 0)}</Text>
                  <Text style={styles.subtotalLine}>
                    Frete ({selectedOption.method}): {money(selectedOption.price)}
                  </Text>
                  <Text style={styles.total}>Total: {money(totalWithShipping)}</Text>
                </>
              ) : (
                <Text style={styles.total}>Total: {money(cart?.total ?? 0)}</Text>
              )}
              <Button
                label="Finalizar pedido"
                onPress={() =>
                  navigation.navigate(
                    'Checkout',
                    selectedOption
                      ? { shippingMethod: selectedOption.method, shippingPrice: selectedOption.price }
                      : undefined,
                  )
                }
              />
            </View>
          ) : null
        }
      />
      <View style={styles.bottomActions}>
        <Button label="Meus pedidos" variant="ghost" onPress={() => navigation.navigate('Orders')} />
        <Button label="Sair" variant="ghost" onPress={signOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  list: { padding: 12, gap: 10 },
  hi: { fontSize: 14, color: '#374151', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f9fafb', borderRadius: 12, padding: 10 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827' },
  sub: { fontSize: 12, color: '#6b7280' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { fontSize: 20, fontWeight: '700', color: '#111827', paddingHorizontal: 6 },
  qty: { fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  remove: { fontSize: 12, color: '#b91c1c', marginLeft: 6 },
  footer: { marginTop: 16, gap: 10 },
  total: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'right' },
  subtotalLine: { fontSize: 13, color: '#6b7280', textAlign: 'right' },
  bottomActions: { flexDirection: 'row', gap: 10, padding: 12 },
  shipping: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, gap: 8 },
  shippingTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  shippingRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  shippingInput: { flex: 1 },
  shippingError: { fontSize: 12, color: '#b91c1c' },
  shippingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
  },
  shippingMethod: { fontSize: 13, fontWeight: '600', color: '#111827' },
  shippingDetail: { fontSize: 13, color: '#6b7280' },
});