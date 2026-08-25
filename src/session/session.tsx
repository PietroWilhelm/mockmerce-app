import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { restoreCustomerToken, setCustomerToken, setOnUnauthorized } from '@/services/http';
import {
  login as loginService,
  register as registerService,
  me as meService,
} from '@/services/auth';
import { queryKeys } from '@/lib/queryKeys';
import type { Customer } from '@/types/api';

interface SessionValue {
  customer: Customer | null;
  isLoggedIn: boolean;
  isBooting: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const queryClient = useQueryClient();

  function clearSession() {
    setCustomer(null);
    queryClient.removeQueries({ queryKey: queryKeys.cart.all });
    queryClient.removeQueries({ queryKey: queryKeys.orders.all });
    queryClient.removeQueries({ queryKey: queryKeys.favorites.all });
  }

  // RF-12: na abertura do app, repõe o token do SecureStore e valida com
  // GET /v1/auth/me. Token ausente ou inválido só derruba pro login.
  useEffect(() => {
    (async () => {
      const token = await restoreCustomerToken();
      if (!token) {
        setIsBooting(false);
        return;
      }
      try {
        const restoredCustomer = await meService();
        setCustomer(restoredCustomer);
      } catch {
        await setCustomerToken(null);
      } finally {
        setIsBooting(false);
      }
    })();
  }, []);

  // RF-16: um 401 em qualquer rota de comprador (disparado pelo interceptor
  // em http.ts) derruba a sessão local também.
  useEffect(() => {
    setOnUnauthorized(clearSession);
    return () => setOnUnauthorized(null);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      customer,
      isLoggedIn: customer !== null,
      isBooting,
      async signIn(email, password) {
        const res = await loginService(email, password);
        await setCustomerToken(res.token);
        setCustomer(res.customer);
      },
      async signUp(name, email, password) {
        const res = await registerService(name, email, password);
        await setCustomerToken(res.token);
        setCustomer(res.customer);
      },
      async signOut() {
        await setCustomerToken(null);
        clearSession();
      },
    }),
    [customer, isBooting, queryClient],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession precisa estar dentro de <SessionProvider>.');
  return ctx;
}
