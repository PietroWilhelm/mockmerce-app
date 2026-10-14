import { createNavigationContainerRef } from '@react-navigation/native';

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type RootStackParamList = {
  Products: undefined;
  ProductDetail: { id: string; name: string };
  Cart: undefined;
  Checkout: { shippingMethod?: string; shippingPrice?: number } | undefined;
  Orders: undefined;
  Order: { id: string };
  Favorites: undefined;
  Review: { productId: string; productName: string };
  PickupPoints: undefined;
  Profile: undefined;
};

// ---- Navegar de fora das telas (toque numa notificação) ---------------------
//
// O toque chega por um listener, fora de qualquer componente — ali não existe
// `useNavigation()`. A saída é uma referência ao NavigationContainer.
//
// O caso difícil é o app FECHADO (RF-59): o toque abre o app e chega ANTES de
// a sessão ser restaurada e de o stack logado existir. Navegar nesse instante
// não faz nada e não avisa. Por isso o destino fica pendente até que a rota
// exista de fato (onReady / onStateChange do container, em App.tsx).

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export type DeepLinkTarget =
  | { screen: 'ProductDetail'; params: RootStackParamList['ProductDetail'] }
  | { screen: 'Favorites' }
  | { screen: 'Products' };

let pending: DeepLinkTarget | null = null;

/** A rota só existe no stack logado; no stack de login ela ainda não está montada. */
function canNavigateTo(target: DeepLinkTarget): boolean {
  if (!navigationRef.isReady()) return false;
  const routeNames: readonly string[] = navigationRef.getRootState()?.routeNames ?? [];
  return routeNames.includes(target.screen);
}

function go(target: DeepLinkTarget) {
  if (target.screen === 'ProductDetail') navigationRef.navigate('ProductDetail', target.params);
  else navigationRef.navigate(target.screen);
}

export function navigateFromOutside(target: DeepLinkTarget): void {
  if (canNavigateTo(target)) go(target);
  else pending = target;
}

/** Ligado ao onReady e ao onStateChange do NavigationContainer. */
export function flushPendingNavigation(): void {
  if (!pending || !canNavigateTo(pending)) return;
  const target = pending;
  pending = null;
  go(target);
}
