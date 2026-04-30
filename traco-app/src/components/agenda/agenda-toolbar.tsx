'use client';

import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Props = {
  currentDate: string; // YYYY-MM-DD
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function fmt(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
  const label = format(parsed, "EEEE, dd 'de' MMMM", { locale: ptBR }).replace(
    /^(\w)/,
    (c) => c.toUpperCase(),
  );

  return (
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
  );
}
