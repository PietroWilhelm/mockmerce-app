import { useMutation } from '@tanstack/react-query';
import { quoteShipping } from '@/services/shipping';

export function useShippingQuote() {
  return useMutation({ mutationFn: quoteShipping });
}
