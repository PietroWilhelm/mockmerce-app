import axios, { AxiosError } from 'axios';
import { env } from '@/env';
import { ApiError } from '@/types/api';
import { getToken, saveToken, clearToken } from './tokenStorage';

export const http = axios.create({
  baseURL: `${env.apiUrl}/v1`,
  timeout: 15000,
  // Sem 'Content-Type' fixo aqui: o axios já manda application/json sozinho
  // quando o corpo é um objeto. Com o header fixo na instância, o axios
  // CONVERTE um FormData em JSON e o POST /uploads chega sem arquivo; sem
  // ele, o FormData sai como multipart e o React Native gera o boundary.
  headers: {
    'X-API-Key': env.apiKey,
    'X-Student-RM': env.studentRm,
  },
});

let customerToken: string | null = null;

// Chamado pela sessão para reagir a um 401 (ver RF-16) sem que este arquivo
// precise conhecer o SessionProvider.
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: (() => void) | null) {
  onUnauthorized = callback;
}

export async function setCustomerToken(token: string | null) {
  customerToken = token;
  if (token) {
    await saveToken(token);
  } else {
    await clearToken();
  }
}

// Lida na abertura do app: repõe o token guardado no SecureStore na variável
// em memória, que é o que o interceptor abaixo realmente lê.
export async function restoreCustomerToken(): Promise<string | null> {
  const token = await getToken();
  customerToken = token;
  return token;
}

http.interceptors.request.use((config) => {
  if (customerToken) {
    config.headers.set('Authorization', `Bearer ${customerToken}`);
  } else {
    config.headers.delete('Authorization');
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data?.error;
    
    // Se o status for 401 e houver token, significa que o token expirou ou foi invalidado.
    if (status === 401 && customerToken) {
      setCustomerToken(null);
      onUnauthorized?.();
    }

    if (payload) {
      return Promise.reject(new ApiError(payload.code ?? 'ERROR', payload.message ?? 'Erro na API', status));
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError('TIMEOUT', 'A requisição demorou demais.', status));
    }
    return Promise.reject(
      new ApiError('NETWORK_ERROR', 'Sem conexão com o servidor. Confira a URL da API.', status),
    );
  },
);
