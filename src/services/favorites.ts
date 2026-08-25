import { http } from './http';
import type { FavoriteItem } from '@/types/api';

export async function listFavorites(): Promise<FavoriteItem[]> {
  const { data } = await http.get<FavoriteItem[]>('/customers/me/favorites');
  return data;
}

export async function addFavorite(variantId: string): Promise<FavoriteItem> {
  const { data } = await http.post<FavoriteItem>('/customers/me/favorites', { variantId });
  return data;
}

export async function removeFavorite(variantId: string): Promise<void> {
  await http.delete(`/customers/me/favorites/${variantId}`);
}
