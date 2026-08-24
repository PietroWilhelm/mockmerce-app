import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { queryClient } from '@/lib/queryClient';
import { SessionProvider, useSession } from '@/session/session';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { SignInScreen } from '@/screens/SignInScreen';
import { SignUpScreen } from '@/screens/SignUpScreen';
import { ForgotPasswordScreen } from '@/screens/ForgotPasswordScreen';
import { ProductsScreen } from '@/screens/ProductsScreen';
import { ProductDetailScreen } from '@/screens/ProductDetailScreen';
import { CartScreen } from '@/screens/CartScreen';
import { CheckoutScreen } from '@/screens/CheckoutScreen';
import { OrderScreen } from '@/screens/OrderScreen';
import { OrdersScreen } from '@/screens/OrdersScreen';
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
      <AppStack.Screen name="Products" component={ProductsScreen} options={{ title: theme.storeName }} />
      <AppStack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={({ route }) => ({ title: route.params.name })}
      />
      <AppStack.Screen name="Cart" component={CartScreen} options={{ title: 'Carrinho' }} />
      <AppStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Finalizar pedido' }} />
      <AppStack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Meus pedidos' }} />
      <AppStack.Screen name="Order" component={OrderScreen} options={{ title: 'Pedido' }} />
    </AppStack.Navigator>
  );
}

function RootNavigator() {
  const { isLoggedIn } = useSession();
  return isLoggedIn ? <AppFlow /> : <AuthFlow />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SessionProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
            <StatusBar style="dark" />
          </SessionProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
