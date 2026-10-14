import { http } from './http';
import type { CanReview, NewReview, Review, ReviewsResponse } from '@/types/api';

/** Lista pública: qualquer visitante vê. A API já tira as ocultadas (menos as do próprio autor). */
export async function listReviews(productId: string): Promise<ReviewsResponse> {
  const { data } = await http.get<ReviewsResponse>(`/products/${productId}/reviews`, {
    params: { page: 1, pageSize: 20, sort: 'recent' },
  });
  return data;
}

/** Exige cliente logado. Quando não pode, responde o MOTIVO (NOT_PURCHASED, ALREADY_REVIEWED). */
export async function canReview(productId: string): Promise<CanReview> {
  const { data } = await http.get<CanReview>(`/products/${productId}/reviews/can-review`);
  return data;
}

export async function createReview(productId: string, review: NewReview): Promise<Review> {
  const { data } = await http.post<Review>(`/products/${productId}/reviews`, review);
  return data;
}
