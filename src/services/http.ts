import axios, { AxiosError } from 'axios';
import { env } from '@/env';
import { ApiError } from '@/types/api';

export const http = axios.create({
  baseURL: `${env.apiUrl}/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': env.apiKey,
    'X-Student-RM': env.studentRm,
  },
});

let customerToken: string | null = null;

export function setCustomerToken(token: string | null) {
  customerToken = token;
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
