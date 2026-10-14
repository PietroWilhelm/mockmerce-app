// Instala o handler de notificação ANTES de qualquer tela montar (ver o arquivo).
import '@/lib/notifications';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { queryClient } from '@/lib/queryClient';
import { SessionProvider, useSession } from '@/session/session';
import { NotificationsProvider } from '@/notifications/NotificationsProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { Loading } from '@/components/ui';
import { SignInScreen } from '@/screens/SignInScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { ForgotPasswordScreen } from '@/screens/ForgotPasswordScreen';
import { ProductsScreen } from '@/screens/ProductsScreen';
import { ProductDetailScreen } from '@/screens/ProductDetailScreen';
import { CartScreen } from '@/screens/CartScreen';
import { CheckoutScreen } from '@/screens/CheckoutScreen';
import { OrderScreen } from '@/screens/OrderScreen';
import { OrdersScreen } from '@/screens/OrdersScreen';
import { FavoritesScreen } from '@/screens/FavoritesScreen';
import { ReviewScreen } from '@/screens/ReviewScreen';
import { PickupPointsScreen } from '@/screens/PickupPointsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { flushPendingNavigation, navigationRef } from '@/navigation';
import type { AuthStackParamList, RootStackParamList } from '@/navigation';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<RootStackParamList>();

function AuthFlow() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function AppFlow() {
  const theme = useTheme();
  return (
    <AppStack.Navigator screenOptions={{ headerTintColor: theme.primary }}>
      {/* A vitrine desenha o próprio topo (bloco roxo com busca); o cabeçalho nativo duplicaria o nome. */}
      <AppStack.Screen
        name="Products"
        component={ProductsScreen}
        options={{ title: theme.storeName, headerShown: false }}
      />
      <AppStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <AppStack.Screen name="Cart" component={CartScreen} options={{ title: 'Carrinho' }} />
      <AppStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Finalizar pedido' }} />
      <AppStack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Meus pedidos' }} />
      <AppStack.Screen name="Order" component={OrderScreen} options={{ title: 'Pedido' }} />
      <AppStack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favoritos' }} />
      <AppStack.Screen name="Review" component={ReviewScreen} options={{ title: 'Avaliar produto' }} />
      <AppStack.Screen name="PickupPoints" component={PickupPointsScreen} options={{ title: 'Onde retirar' }} />
      <AppStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </AppStack.Navigator>
  );
}

function RootNavigator() {
  const { isLoggedIn, isBooting } = useSession();
  if (isBooting) return <Loading label="Restaurando sessão…" />;
  return isLoggedIn ? <AppFlow /> : <AuthFlow />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SessionProvider>
            <NotificationsProvider>
              {/*
                O ref + onReady/onStateChange fazem o toque numa notificação
                funcionar com o app FECHADO: o destino espera o stack logado
                existir (ver src/navigation.ts).
              */}
              <NavigationContainer
                ref={navigationRef}
                onReady={flushPendingNavigation}
                onStateChange={flushPendingNavigation}
              >
                <RootNavigator />
              </NavigationContainer>
            </NotificationsProvider>
            <StatusBar style="dark" />
          </SessionProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
