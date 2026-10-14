export const defaultTheme = {
  primary: '#7e17d3',
  storeName: 'Dr.Mouse',
  logoUrl: null as string | null,
};

export type Theme = typeof defaultTheme;

/**
 * Cores neutras do app.
 * A cor da marca continua vindo do ThemeProvider (`theme.primary`); aqui fica
 * só o que não muda de loja para loja.
 */
export const colors = {
  text: '#111827',
  textBody: '#374151',
  textMuted: '#6b7280',
  textSoft: '#9ca3af',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  surface: '#ffffff',
  surfaceAlt: '#f9fafb',
  danger: '#b91c1c',
  warning: '#b45309',
  warningBg: '#fffbeb',
  success: '#15803d',
};

/** A cor da marca com transparência, para fundos de destaque (ex.: `#7e17d3` → `#7e17d314`). */
export function tint(hex: string, alpha = '14'): string {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${alpha}` : hex;
}
