/**
 * Configuração lida do ambiente (arquivo .env).
 * O Expo injeta qualquer variável EXPO_PUBLIC_* em process.env no bundle.
 */
export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.mockmerce.com.br',
  apiKey: process.env.EXPO_PUBLIC_API_KEY ?? '',
  studentRm: process.env.EXPO_PUBLIC_STUDENT_RM ?? '',
};

if (!env.apiKey) {
  // Aviso de dev: sem API Key nada funciona (todas as rotas exigem X-API-Key).
  console.warn(
    '[env] EXPO_PUBLIC_API_KEY vazio. Copie .env.example para .env e preencha a chave do grupo.',
  );
}
