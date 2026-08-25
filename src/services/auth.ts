import { http } from './http';
import type { AuthResponse, Customer } from '@/types/api';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

// SecureStore é assíncrono, o interceptor do axios não pode esperar uma Promise no meio do request.
// devo manter tanto em memoria quanto no SecureStore, e o meService() é chamado na abertura do app para validar o token guardado.
export async function me(): Promise<Customer> {
  const { data } = await http.get<Customer>('/auth/me');
  return data;
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/register', { name, email, password });
  return data;
}

export async function forgotPassword(email: string): Promise<void> {
  await http.post('/auth/forgot-password', { email });
}

export async function resetPassword(email: string, code: string, newPassword: string): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/reset-password', { email, code, newPassword });
  return data;
}