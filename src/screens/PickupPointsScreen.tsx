/**
 * Onde retirar: mapa com os pontos e a loja, e a lista embaixo.
 *
 * O assunto desta tela não é o mapa, é o que acontece SEM o GPS:
 *   posição ok         -> lista ordenada, com a distância em cada ponto
 *   negada             -> mesma lista, na ordem da loja, e um aviso com o porquê
 *   concedida sem pos. -> idem, com "tentar localizar de novo"
 * Nos três casos a lista aparece. A permissão melhora a tela; não decide se
 * ela existe (RF-45).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { usePickupPoints } from '@/hooks/usePickupPoints';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { PickupPointCard } from '@/components/PickupPointCard';
import { LocationNotice } from '@/components/LocationNotice';
import { AnimatedListItem } from '@/components/motion/AnimatedListItem';
import { EmptyState, ErrorState, Loading } from '@/components/ui';
import { cameraDuration, useMotionMode } from '@/theme/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { colors } from '@/theme/theme';
import type { ApiError, Coordinate } from '@/types/api';

/** Centro de São Paulo: só para o mapa nascer num lugar plausível se não houver nada. */
const FALLBACK_REGION: Region = { latitude: -23.5505, longitude: -46.6333, latitudeDelta: 0.2, longitudeDelta: 0.2 };

/** A menor região que mostra todos os pontos, com folga nas bordas. */
function regionFor(coordinates: Coordinate[]): Region {
  if (coordinates.length === 0) return FALLBACK_REGION;
  const latitudes = coordinates.map((c) => c.latitude);
  const longitudes = coordinates.map((c) => c.longitude);
  const [minLat, maxLat] = [Math.min(...latitudes), Math.max(...latitudes)];
  const [minLng, maxLng] = [Math.min(...longitudes), Math.max(...longitudes)];
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.02),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.02),
  };
}

export function PickupPointsScreen() {
  const theme = useTheme();
  const mode = useMotionMode();
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { points, isPending, isError, error, refetch, isSortedByDistance, location } = usePickupPoints();
  const { data: settings } = useStoreSettings();

  const store: Coordinate | null =
    settings?.latitude != null && settings?.longitude != null
      ? { latitude: settings.latitude, longitude: settings.longitude }
      : null;

  const region = useMemo(() => {
    const coordinates = points.map((point) => point.coordinate);
    if (store) coordinates.push(store);
    if (location.position) coordinates.push(location.position);
    return regionFor(coordinates);
  }, [points, store?.latitude, store?.longitude, location.position]);

  // Quando a posição chega (ou a lista muda), reenquadra o mapa.
  useEffect(() => {
    mapRef.current?.animateToRegion(region, cameraDuration(mode));
  }, [region, mode]);

  function focus(pointId: string, coordinate: Coordinate) {
    setSelectedId(pointId);
    mapRef.current?.animateToRegion({ ...coordinate, latitudeDelta: 0.01, longitudeDelta: 0.01 }, cameraDuration(mode));
  }

  // RF-48: carregando / erro / vazio
  if (isPending) return <Loading label="Buscando pontos de retirada…" />;
  if (isError && points.length === 0) {
    return <ErrorState message={(error as ApiError).message} onRetry={() => refetch()} />;
  }
  if (points.length === 0) {
    return (
      <EmptyState
        title="Nenhum ponto de retirada ainda"
        message="A loja ainda não cadastrou onde retirar. Por enquanto, os pedidos são só com entrega."
      />
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        // O ponto azul só aparece com permissão; sem ela o mapa só não o desenha.
        showsUserLocation={location.status === 'ok'}
      >
        {store && (
          <Marker
            coordinate={store}
            title={theme.storeName}
            description="Nossa loja"
            pinColor={theme.primary}
          />
        )}
        {points.map((point) => (
          <Marker
            key={point.id}
            coordinate={point.coordinate}
            title={point.name}
            description={point.hours ?? undefined}
            pinColor={point.id === selectedId ? theme.primary : colors.textMuted}
            onPress={() => setSelectedId(point.id)}
          />
        ))}
      </MapView>

      <FlatList
        data={points}
        keyExtractor={(point) => point.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <LocationNotice location={location} />
            <Text style={styles.caption}>
              {isSortedByDistance ? 'Do mais perto para o mais longe de você.' : 'Na ordem cadastrada pela loja.'}
              {store ? ` O pino roxo é a loja ${theme.storeName}.` : ''}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <PickupPointCard point={item} selected={item.id === selectedId} onPress={() => focus(item.id, item.coordinate)} />
          </AnimatedListItem>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  map: { height: 250, width: '100%' },
  list: { padding: 12, gap: 10 },
  header: { gap: 8, marginBottom: 2 },
  caption: { fontSize: 12, color: colors.textMuted },
});
