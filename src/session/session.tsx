import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setCustomerToken } from '@/services/http';
import { login as loginService, register as registerService } from '@/services/auth';
import { queryKeys } from '@/lib/queryKeys';
import type { Customer } from '@/types/api';

interface SessionValue {
  customer: Customer | null;
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const queryClient = useQueryClient();

  const value = useMemo<SessionValue>(
    () => ({
      customer,
      isLoggedIn: customer !== null,
      async signIn(email, password) {
        const res = await loginService(email, password);
        setCustomerToken(res.token);
        setCustomer(res.customer);
      },
      async signUp(name, email, password) {
        const res = await registerService(name, email, password);
        setCustomerToken(res.token);
        setCustomer(res.customer);
      },
      signOut() {
        setCustomerToken(null);
        setCustomer(null);
        queryClient.removeQueries({ queryKey: queryKeys.cart.all });
        queryClient.removeQueries({ queryKey: queryKeys.orders.all });
      },
    }),
    [customer, queryClient],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession precisa estar dentro de <SessionProvider>.');
  return ctx;
}
