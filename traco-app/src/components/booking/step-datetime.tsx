'use client';

import {
  CalendarOff,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import type { PublicService } from '@/lib/queries/public-booking';
import { cn } from '@/lib/utils';
import { refreshAvailableSlots } from '@/server/actions/booking';

import { WaitlistModal } from './waitlist-modal';

type Slot = { start: string; end: string };

type Props = {
  slug: string;
  service: PublicService;
  waitlistEnabled: boolean;
  selectedDateTime: string | null;
  onSelectDateTime: (iso: string | null) => void;
  onAdvance: () => void;
  clientName: string;
};

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function timeFromIso(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '';
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function StepDateTime({
  slug,
  service,
  waitlistEnabled,
  selectedDateTime,
  onSelectDateTime,
  onAdvance,
}: Props) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [anchor, setAnchor] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [pending, startTransition] = useTransition();
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [anchor]);

  useEffect(() => {
    const dateKey = toDateKey(selectedDate);
    startTransition(async () => {
      const result = await refreshAvailableSlots({
        slug,
        procedureId: service.procedure_id,
        date: dateKey,
      });
      setSlots(result.slots);
    });
  }, [selectedDate, slug, service.procedure_id]);

  function handleSelectSlot(slot: Slot) {
    onSelectDateTime(slot.start);
  }

  function handleNextDate() {
    const next = new Date(anchor);
    next.setDate(anchor.getDate() + 7);
    setAnchor(next);
  }

  function handlePrevDate() {
    const prev = new Date(anchor);
    prev.setDate(anchor.getDate() - 7);
    if (prev < today) return;
    setAnchor(prev);
  }

  const monthLabel = MONTHS[anchor.getMonth()];
  const yearLabel = anchor.getFullYear();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Selecionar horário
        </h1>
      </div>

      <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-cream-dark/60 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-foreground">
        <User className="size-3.5" />
        Sem preferência de profissional
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-cream-dark bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-serif text-base font-medium capitalize text-foreground">
            {monthLabel} {yearLabel}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevDate}
              disabled={anchor.getTime() <= today.getTime()}
              className="inline-flex size-9 items-center justify-center rounded-full text-foreground hover:bg-cream-dark/50 disabled:opacity-40"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleNextDate}
              className="inline-flex size-9 items-center justify-center rounded-full text-foreground hover:bg-cream-dark/50"
              aria-label="Próxima semana"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const isSel = isSameDay(d, selectedDate);
            const isToday = isSameDay(d, today);
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg py-2 transition-colors',
                  isSel
                    ? 'bg-[var(--gold)] text-ink'
                    : 'text-foreground hover:bg-cream-dark/40',
                  isToday && !isSel && 'ring-1 ring-[var(--gold)]/40',
                )}
                aria-pressed={isSel}
                aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]}`}
              >
                <span className="text-base font-medium tabular-nums sm:text-lg">
                  {d.getDate()}
                </span>
                <span className="text-[9px] uppercase tracking-[0.14em]">
                  {WEEKDAYS[d.getDay()]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {pending ? (
          <div className="flex items-center justify-center rounded-xl border border-cream-dark bg-card p-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : slots.length === 0 ? (
          <EmptySlots
            slug={slug}
            procedureId={service.procedure_id}
            selectedDate={selectedDate}
            waitlistEnabled={waitlistEnabled}
            onPickDate={(d) => {
              setSelectedDate(d);
              setAnchor(d);
            }}
            onOpenWaitlist={() => setWaitlistOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {slots.map((slot) => {
              const isSel = selectedDateTime === slot.start;
              return (
                <button
                  key={slot.start}
                  type="button"
                  onClick={() => handleSelectSlot(slot)}
                  className={cn(
                    'inline-flex h-12 items-center justify-center rounded-lg border bg-card text-sm font-medium transition-all',
                    isSel
                      ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-foreground ring-2 ring-[var(--gold)]/30'
                      : 'border-cream-dark text-foreground hover:border-[var(--gold)]/60',
                  )}
                  aria-pressed={isSel}
                >
                  {timeFromIso(slot.start)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {waitlistEnabled && slots.length > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          Não encontra um horário conveniente?{' '}
          <button
            type="button"
            onClick={() => setWaitlistOpen(true)}
            className="text-[var(--gold)] underline-offset-2 hover:underline"
          >
            Entrar na lista de espera
          </button>
        </p>
      ) : null}

      <WaitlistModal
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        slug={slug}
        procedureId={service.procedure_id}
        procedureName={service.procedure.name}
        defaultDate={toDateKey(selectedDate)}
      />

      {selectedDateTime ? (
        <Button
          variant="premium"
          size="xl"
          onClick={onAdvance}
          className="w-full lg:hidden"
        >
          Continuar com {timeFromIso(selectedDateTime)}
        </Button>
      ) : null}
    </div>
  );
}

function EmptySlots({
  slug,
  procedureId,
  selectedDate,
  waitlistEnabled,
  onPickDate,
  onOpenWaitlist,
}: {
  slug: string;
  procedureId: string;
  selectedDate: Date;
  waitlistEnabled: boolean;
  onPickDate: (d: Date) => void;
  onOpenWaitlist: () => void;
}) {
  const [searching, startSearch] = useTransition();
  const [nextDate, setNextDate] = useState<string | null>(null);

  useEffect(() => {
    setNextDate(null);
    startSearch(async () => {
      const start = new Date(selectedDate);
      start.setDate(selectedDate.getDate() + 1);
      const startKey = toDateKey(start);
      // Tenta os próximos 30 dias procurando o primeiro com slots
      let found: string | null = null;
      for (let i = 0; i < 30 && !found; i += 1) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = toDateKey(d);
        const result = await refreshAvailableSlots({
          slug,
          procedureId,
          date: key,
        });
        if (result.slots.length > 0) found = key;
        // breakcheck: se acima de 30 dias e nada, retorna null
        void startKey;
      }
      setNextDate(found);
    });
  }, [slug, procedureId, selectedDate]);

  function handleGoToNext() {
    if (!nextDate) return;
    const [y, m, d] = nextDate.split('-').map(Number);
    onPickDate(new Date(y, m - 1, d));
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-cream-dark bg-card p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-[var(--gold)]/10">
        <CalendarOff className="size-7 text-[var(--gold)]" strokeWidth={1.25} />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-serif text-base text-foreground">
          A profissional não tem horários disponíveis nesta data.
        </p>
        {searching ? (
          <p className="text-xs text-muted-foreground">Procurando próxima data…</p>
        ) : nextDate ? (
          <p className="text-xs text-muted-foreground">
            Próxima data com horários:{' '}
            <span className="font-medium text-foreground">
              {formatBR(nextDate)}
            </span>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Nenhuma data disponível nos próximos 30 dias.
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {nextDate ? (
          <Button variant="premium" size="default" onClick={handleGoToNext}>
            <CalendarRange className="size-4" />
            Ir para próxima data disponível
          </Button>
        ) : null}
        {waitlistEnabled ? (
          <Button variant="outline-gold" size="default" onClick={onOpenWaitlist}>
            Entrar na lista de espera
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function formatBR(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  return `${pad(d)}/${pad(m)}/${y}`;
}
