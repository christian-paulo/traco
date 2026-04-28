'use client';

import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Props = {
  initialFrom: string;
  initialTo: string;
};

type Preset = {
  key: string;
  label: string;
  resolve: () => DateRange;
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

const PRESETS: Preset[] = [
  {
    key: '7d',
    label: 'Últimos 7 dias',
    resolve: () => {
      const today = startOfDay(new Date());
      const from = new Date(today);
      from.setDate(today.getDate() - 6);
      return { from, to: today };
    },
  },
  {
    key: '30d',
    label: 'Últimos 30 dias',
    resolve: () => {
      const today = startOfDay(new Date());
      const from = new Date(today);
      from.setDate(today.getDate() - 29);
      return { from, to: today };
    },
  },
  {
    key: 'this-month',
    label: 'Este mês',
    resolve: () => {
      const today = startOfDay(new Date());
      return { from: startOfMonth(today), to: today };
    },
  },
  {
    key: 'last-month',
    label: 'Mês passado',
    resolve: () => {
      const today = startOfDay(new Date());
      const ref = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return { from: startOfMonth(ref), to: endOfMonth(ref) };
    },
  },
  {
    key: 'this-year',
    label: 'Este ano',
    resolve: () => {
      const today = startOfDay(new Date());
      return { from: new Date(today.getFullYear(), 0, 1), to: today };
    },
  },
];

function parseDate(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, 'yyyy-MM-dd', new Date());
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function DateRangePicker({ initialFrom, initialTo }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialRange = useMemo<DateRange | undefined>(() => {
    const from = parseDate(initialFrom);
    const to = parseDate(initialTo);
    if (!from && !to) return undefined;
    return { from, to };
  }, [initialFrom, initialTo]);

  const [range, setRange] = useState<DateRange | undefined>(initialRange);

  function applyRange(value: DateRange | undefined) {
    setRange(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value?.from) params.set('from', format(value.from, 'yyyy-MM-dd'));
    else params.delete('from');
    if (value?.to) params.set('to', format(value.to, 'yyyy-MM-dd'));
    else params.delete('to');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const label = range?.from
    ? range.to && range.to.getTime() !== range.from.getTime()
      ? `${format(range.from, "dd 'de' MMM", { locale: ptBR })} – ${format(range.to, "dd 'de' MMM", { locale: ptBR })}`
      : format(range.from, "dd 'de' MMM yyyy", { locale: ptBR })
    : 'Selecione um período';

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="h-11 justify-start gap-2 sm:w-72"
          >
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span className={range?.from ? '' : 'text-muted-foreground'}>{label}</span>
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex flex-wrap gap-1.5 border-b border-cream-dark p-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => applyRange(preset.resolve())}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs uppercase tracking-[0.1em] transition-colors',
                'hover:bg-cream text-foreground',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <Calendar
          mode="range"
          selected={range}
          onSelect={applyRange}
          numberOfMonths={2}
          locale={ptBR}
          captionLayout="dropdown"
        />
      </PopoverContent>
    </Popover>
  );
}
