import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCart } from '@/hooks/useCart';
import { useCheckout } from '@/hooks/useOrderActions';
import { usePickupPoints } from '@/hooks/usePickupPoints';
import { Button, ErrorState, Loading, Notice } from '@/components/ui';
import { PressableScale } from '@/components/motion/PressableScale';
import { LoadingDots } from '@/components/motion/LoadingDots';
import { PickupPointCard } from '@/components/PickupPointCard';
import { LocationNotice } from '@/components/LocationNotice';
import { money } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { colors, tint } from '@/theme/theme';
import type { RootStackParamList } from '@/navigation';
import type { ApiError } from '@/types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

type Fulfillment = 'delivery' | 'pickup';

export function CheckoutScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { data: cart, isLoading, isError, error, refetch } = useCart();
  const checkoutMutation = useCheckout();
  const [fulfillment, setFulfillment] = useState<Fulfillment>('delivery');
  const [pickupPointId, setPickupPointId] = useState<string | null>(null);
  // A localização só é pedida quando a pessoa escolhe retirar: é aí que ela
  // entende por que o app quer saber onde ela está.
  const pickup = usePickupPoints({ locate: fulfillment === 'pickup' });

  const shippingMethod = route.params?.shippingMethod;
  const shippingPrice = fulfillment === 'delivery' ? route.params?.shippingPrice ?? 0 : 0;

  if (isLoading) return <Loading label="Carregando carrinho…" />;
  if (isError) return <ErrorState message={(error as ApiError).message} onRetry={() => refetch()} />;

  const items = cart?.items ?? [];
  const productsTotal = cart?.total ?? 0;
  const totalWithShipping = productsTotal + shippingPrice;

  if (items.length === 0) {
    return <ErrorState message="Seu carrinho está vazio. Adicione produtos antes de finalizar." />;
  }

  function confirm() {
    if (fulfillment === 'pickup' && !pickupPointId) {
      Alert.alert('Escolha o ponto', 'Selecione onde você quer retirar o pedido.');
      return;
    }
    checkoutMutation.mutate(fulfillment === 'pickup' ? pickupPointId ?? undefined : undefined, {
      onSuccess: (order) => navigation.replace('Order', { id: order.id }),
      onError: (err) => Alert.alert('Erro ao criar pedido', (err as ApiError).message ?? 'Tente novamente.'),
    });
  }

  function renderPickupOptions() {
    if (pickup.isPending) {
      return (
        <View style={styles.inline}>
          <LoadingDots />
          <Text style={styles.muted}>Buscando pontos de retirada…</Text>
        </View>
      );
    }
    if (pickup.isError && pickup.points.length === 0) {
      return (
        <Notice
          tone="warning"
          message="Não foi possível carregar os pontos de retirada."
          actionLabel="Tentar de novo"
          onAction={() => pickup.refetch()}
        />
      );
    }
    if (pickup.points.length === 0) {
      return <Notice message="Esta loja ainda não tem pontos de retirada. Escolha a entrega em casa." />;
    }
    return (
      <View style={styles.points}>
        <LocationNotice location={pickup.location} />
        {pickup.points.map((point) => (
          <PickupPointCard
            key={point.id}
            point={point}
            selected={point.id === pickupPointId}
            onPress={() => setPickupPointId(point.id)}
          />
        ))}
      </View>
    );
  }

  const options: { value: Fulfillment; label: string; detail: string }[] = [
    { value: 'delivery', label: 'Receber em casa', detail: shippingMethod ? `${shippingMethod} · ${money(route.params?.shippingPrice ?? 0)}` : 'Frete combinado no carrinho' },
    { value: 'pickup', label: 'Retirar num ponto', detail: 'Sem frete' },
  ];

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
        ListFooterComponent={
          <View style={styles.fulfillment}>
            <Text style={styles.sectionTitle}>Como você quer receber?</Text>
            <View style={styles.options}>
              {options.map((option) => {
                const active = option.value === fulfillment;
                return (
                  <PressableScale
                    key={option.value}
                    onPress={() => setFulfillment(option.value)}
                    accessibilityState={{ selected: active }}
                    style={[styles.option, active && { borderColor: theme.primary, backgroundColor: tint(theme.primary) }]}
                  >
                    <Text style={[styles.optionLabel, active && { color: theme.primary }]}>{option.label}</Text>
                    <Text style={styles.optionDetail}>{option.detail}</Text>
                  </PressableScale>
                );
              })}
            </View>
            {fulfillment === 'pickup' && renderPickupOptions()}
          </View>
        }
      />

      <View style={styles.footer}>
        {fulfillment === 'delivery' && shippingMethod ? (
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
          onPress={confirm}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  list: { padding: 12, gap: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  rowBody: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  qty: { fontSize: 12, color: colors.textMuted },
  subtotal: { fontSize: 14, fontWeight: '700', color: colors.text },
  fulfillment: { gap: 10, marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  options: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  optionLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  optionDetail: { fontSize: 12, color: colors.textMuted },
  points: { gap: 8 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  muted: { fontSize: 13, color: colors.textMuted },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15, color: colors.textMuted },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  subValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  shippingNote: { fontSize: 11, color: colors.warning },
});
