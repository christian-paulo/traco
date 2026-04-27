const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const dateShortFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateLongFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '';
  return (format === 'long' ? dateLongFormatter : dateShortFormatter).format(value);
}

export function getFirstName(fullName: string): string {
  const trimmed = fullName?.trim() ?? '';
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

export function getInitials(fullName: string | null, fallback = '?'): string {
  const source = (fullName ?? '').trim();
  if (!source) return fallback;
  const parts = source.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return ((first + last).toUpperCase() || source[0]?.toUpperCase()) ?? fallback;
}

export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const value = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return '—';
  const diffMs = Date.now() - value.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 0) return formatDate(value);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'há 1 semana' : `há ${weeks} semanas`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? 'há 1 mês' : `há ${months} meses`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? 'há 1 ano' : `há ${years} anos`;
}
