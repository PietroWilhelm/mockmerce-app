import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Dados do APARELHO que não são segredo (por isso AsyncStorage, e não o
 * SecureStore do token). Hoje só guarda até onde o app já apresentou os
 * avisos da loja, para não repetir a mesma notificação a cada abertura.
 */
const LAST_PRESENTED_MESSAGE_KEY = 'store_messages_last_presented_at';

export async function getLastPresentedMessageAt(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_PRESENTED_MESSAGE_KEY);
  } catch {
    return null;
  }
}

export async function setLastPresentedMessageAt(isoDate: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_PRESENTED_MESSAGE_KEY, isoDate);
  } catch {
    // Falhar aqui só faz o aviso reaparecer na próxima abertura; não derruba nada.
  }
}
