'use client';

import { format, parse, startOfWeek, addDays, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type Props = {
  currentDate: string; // YYYY-MM-DD
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function fmt(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function AgendaToolbar({ currentDate }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(delta: number) {
    const d = parse(currentDate, 'yyyy-MM-dd', new Date());
    d.setDate(d.getDate() + delta);
    setDate(fmt(d));
  }

  function setDate(date: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', date);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function goToday() {
    setDate(fmt(new Date()));
  }

  const parsed = parse(currentDate, 'yyyy-MM-dd', new Date());
  const today = new Date();
  const label = format(parsed, "EEEE, dd 'de' MMMM", { locale: ptBR }).replace(
    /^(\w)/,
    (c) => c.toUpperCase(),
  );

  const weekStart = startOfWeek(parsed, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDays[6];
  const monthLabel = isSameMonth(weekStart, weekEnd)
    ? capitalize(format(weekStart, 'MMMM yyyy', { locale: ptBR }))
    : `${capitalize(format(weekStart, 'MMM', { locale: ptBR }))} – ${capitalize(format(weekEnd, 'MMM yyyy', { locale: ptBR }))}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-cream-dark/60 bg-card px-3 py-4 sm:px-4">
        <p className="mb-3 text-center font-serif text-sm font-medium text-foreground">
          {monthLabel}
        </p>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {weekDays.map((d) => {
            const isSelected = isSameDay(d, parsed);
            const isToday = isSameDay(d, today);
            const weekday = capitalize(format(d, 'EEEEEE', { locale: ptBR }));
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => setDate(fmt(d))}
                className="flex flex-col items-center gap-1.5 rounded-xl py-2 transition-colors hover:bg-cream/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
                aria-label={`Ir para ${format(d, "EEEE, dd 'de' MMMM", { locale: ptBR })}`}
                aria-current={isSelected ? 'date' : undefined}
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {weekday}
                </span>
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full text-sm font-medium tabular-nums transition-all sm:size-10',
                    isSelected
                      ? 'bg-foreground text-background shadow-sm'
                      : isToday
                        ? 'text-foreground ring-1 ring-[var(--gold)]/60'
                        : 'text-foreground',
                  )}
                >
                  {format(d, 'd')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Anterior">
            <ChevronLeft className="size-5" />
          </Button>
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" className="h-10 gap-2 px-4">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <span className="font-medium">{label}</span>
                </Button>
              }
            />
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={parsed}
                onSelect={(d) => {
                  if (d) setDate(fmt(d));
                }}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)} aria-label="Próximo">
            <ChevronRight className="size-5" />
          </Button>
          <Button variant="outline" className="h-10" onClick={goToday}>
            Hoje
          </Button>
        </div>
      </div>
    </div>
  );
}
