import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStoreSettings } from '@/services/store';
import { queryKeys } from '@/lib/queryKeys';
import { defaultTheme, type Theme } from './theme';

const ThemeContext = createContext<Theme>(defaultTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    queryKey: queryKeys.store.settings,
    queryFn: getStoreSettings,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const theme: Theme = {
    primary: data?.primaryColor || defaultTheme.primary,
    storeName: data?.storeName || defaultTheme.storeName,
    logoUrl: data?.logoUrl ?? defaultTheme.logoUrl,
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
