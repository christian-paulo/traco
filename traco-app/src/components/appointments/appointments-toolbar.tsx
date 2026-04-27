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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProcedureRow } from '@/lib/queries/procedures';

const ALL_PROCEDURES = '__all__';

type Props = {
  procedures: ProcedureRow[];
  initialProcedureId: string;
  initialFrom: string;
  initialTo: string;
};

function parseDate(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, 'yyyy-MM-dd', new Date());
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function AppointmentsToolbar({
  procedures,
  initialProcedureId,
  initialFrom,
  initialTo,
}: Props) {
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

  function pushParams(next: URLSearchParams) {
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function setProcedureId(value: string | null) {
    const next = value ?? '';
    const params = new URLSearchParams(searchParams.toString());
    if (next && next !== ALL_PROCEDURES) params.set('procedure', next);
    else params.delete('procedure');
    pushParams(params);
  }

  function applyRange(value: DateRange | undefined) {
    setRange(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value?.from) params.set('from', format(value.from, 'yyyy-MM-dd'));
    else params.delete('from');
    if (value?.to) params.set('to', format(value.to, 'yyyy-MM-dd'));
    else params.delete('to');
    pushParams(params);
  }

  const procedureValue = initialProcedureId || ALL_PROCEDURES;
  const rangeLabel = range?.from
    ? range.to && range.to.getTime() !== range.from.getTime()
      ? `${format(range.from, "dd 'de' MMM", { locale: ptBR })} – ${format(range.to, "dd 'de' MMM", { locale: ptBR })}`
      : format(range.from, "dd 'de' MMM yyyy", { locale: ptBR })
    : 'Selecione um período';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select value={procedureValue} onValueChange={setProcedureId}>
        <SelectTrigger className="h-11 sm:w-64">
          <SelectValue placeholder="Todos os procedimentos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_PROCEDURES}>Todos os procedimentos</SelectItem>
          {procedures.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: p.color }}
                  aria-hidden
                />
                {p.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="h-11 justify-start gap-2 sm:w-72"
            >
              <CalendarIcon className="size-4 text-muted-foreground" />
              <span className={range?.from ? '' : 'text-muted-foreground'}>{rangeLabel}</span>
            </Button>
          }
        />
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="range"
            selected={range}
            onSelect={applyRange}
            numberOfMonths={2}
            locale={ptBR}
            captionLayout="dropdown"
          />
          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <span className="text-xs text-muted-foreground">{rangeLabel}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => applyRange(undefined)}
              disabled={!range?.from}
            >
              Limpar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
