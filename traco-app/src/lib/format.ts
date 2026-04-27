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
