const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Aguardando pagamento',
  PAID: 'Pago',
  CANCELED: 'Cancelado',
  APPROVED: 'Aprovado',
  DECLINED: 'Recusado',
  REFUSED: 'Recusado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#b45309',
  PAID: '#15803d',
  CANCELED: '#b91c1c',
  APPROVED: '#15803d',
  DECLINED: '#b91c1c',
  REFUSED: '#b91c1c',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? '#6b7280';
}
