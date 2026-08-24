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
};
