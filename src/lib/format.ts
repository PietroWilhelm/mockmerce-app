/**
 * Formata um número em reais. Preços da API vêm como number (ex.: 79.9).
 * Formatação manual (sem Intl) para funcionar igual em qualquer device/Hermes.
 */
export function money(value: number): string {
  const fixed = (Math.round(value * 100) / 100).toFixed(2); // 2 casas
  const [intPart, decPart] = fixed.split('.');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${withThousands},${decPart}`;
}
