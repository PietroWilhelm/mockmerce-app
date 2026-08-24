import { http } from './http';
import type { StoreSettings } from '@/types/api';

export async function getStoreSettings(): Promise<StoreSettings> {
  const { data } = await http.get<StoreSettings>('/store/settings');
  return data;
}
