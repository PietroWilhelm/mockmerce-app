import { http } from './http';
import type { StoreMessagesResponse } from '@/types/api';

/**
 * Histórico de avisos que a loja disparou pelo painel (Caminho B das
 * notificações). O app lê isto ao abrir e apresenta como notificação local.
 */
export async function listStoreMessages(pageSize = 20): Promise<StoreMessagesResponse> {
  const { data } = await http.get<StoreMessagesResponse>('/push/messages', {
    params: { page: 1, pageSize },
  });
  return data;
}
