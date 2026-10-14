import { createContext, useContext } from 'react';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { defaultTheme, type Theme } from './theme';

const ThemeContext = createContext<Theme>(defaultTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data } = useStoreSettings();

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
