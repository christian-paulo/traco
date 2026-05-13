export type PeriodPreset =
  | 'hoje'
  | 'ontem'
  | '7d'
  | '14d'
  | 'mes-atual'
  | 'mes-passado'
  | 'ano-atual'
  | 'personalizado';

export const PERIOD_PRESETS: ReadonlyArray<{
  key: PeriodPreset;
  label: string;
}> = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'ontem', label: 'Ontem' },
  { key: '7d', label: '7 dias' },
  { key: '14d', label: '14 dias' },
  { key: 'mes-atual', label: 'Este mês' },
  { key: 'mes-passado', label: 'Mês passado' },
  { key: 'ano-atual', label: 'Este ano' },
  { key: 'personalizado', label: 'Personalizado' },
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export type ResolvedRange = {
  preset: PeriodPreset;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  fromIso: string; // YYYY-MM-DDT00:00:00 local
  toIso: string; // YYYY-MM-DDT23:59:59 local
  label: string;
};

function rangeFromDates(
  preset: PeriodPreset,
  from: Date,
  to: Date,
  label: string,
): ResolvedRange {
  const fromStart = startOfDay(from);
  const toEnd = endOfDay(to);
  return {
    preset,
    fromDate: fmtDate(fromStart),
    toDate: fmtDate(toEnd),
    fromIso: fromStart.toISOString(),
    toIso: toEnd.toISOString(),
    label,
  };
}

export function isPeriodPreset(v: string | undefined): v is PeriodPreset {
  return PERIOD_PRESETS.some((p) => p.key === v);
}

export function resolvePeriod(
  preset: PeriodPreset | undefined,
  customFrom?: string,
  customTo?: string,
): ResolvedRange {
  const now = new Date();
  const today = startOfDay(now);

  if (preset === 'hoje' || !preset) {
    return rangeFromDates('hoje', today, today, 'Hoje');
  }

  if (preset === 'ontem') {
    const y = new Date(today);
    y.setDate(today.getDate() - 1);
    return rangeFromDates('ontem', y, y, 'Ontem');
  }

  if (preset === '7d') {
    const from = new Date(today);
    from.setDate(today.getDate() - 6);
    return rangeFromDates('7d', from, today, 'Últimos 7 dias');
  }

  if (preset === '14d') {
    const from = new Date(today);
    from.setDate(today.getDate() - 13);
    return rangeFromDates('14d', from, today, 'Últimos 14 dias');
  }

  if (preset === 'mes-atual') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    return rangeFromDates('mes-atual', from, today, 'Este mês');
  }

  if (preset === 'mes-passado') {
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const to = new Date(today.getFullYear(), today.getMonth(), 0);
    return rangeFromDates('mes-passado', from, to, 'Mês passado');
  }

  if (preset === 'ano-atual') {
    const from = new Date(today.getFullYear(), 0, 1);
    return rangeFromDates('ano-atual', from, today, 'Este ano');
  }

  // personalizado
  const fallbackFrom = customFrom && /^\d{4}-\d{2}-\d{2}$/.test(customFrom)
    ? new Date(`${customFrom}T00:00:00`)
    : new Date(today.getFullYear(), today.getMonth(), 1);
  const fallbackTo = customTo && /^\d{4}-\d{2}-\d{2}$/.test(customTo)
    ? new Date(`${customTo}T00:00:00`)
    : today;
  return rangeFromDates(
    'personalizado',
    fallbackFrom,
    fallbackTo,
    `${fmtDate(fallbackFrom)} → ${fmtDate(fallbackTo)}`,
  );
}

export function formatMinutesAsHours(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0:00';
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}:${pad(mins)}`;
}
