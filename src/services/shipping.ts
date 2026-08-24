import { http } from './http';
import type { ShippingQuoteOption } from '@/types/api';

interface ShippingQuoteResponse {
  cepDestino: string;
  weightKg: number;
  zone: number;
  options: { service: string; price: number; etaDays: number }[];
}

export async function quoteShipping(cepDestino: string): Promise<ShippingQuoteOption[]> {
  const { data } = await http.post<ShippingQuoteResponse>('/sandbox/shipping/quote', { cepDestino });
  return data.options.map((option) => ({
    method: option.service,
    price: option.price,
    deadlineDays: option.etaDays,
  }));
}
