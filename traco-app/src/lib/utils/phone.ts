export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatPhoneBR(value: string): string {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidPhoneBR(value: string): boolean {
  const len = digitsOnly(value).length;
  return len === 10 || len === 11;
}
