'use client';

import { AlertTriangle, Play } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

export type AgendaAppointment = {
  id: string;
  client_id: string;
  client_name: string;
  procedure_name: string;
  procedure_color: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  status: string;
  price: number;
  has_active_reaction: boolean;
};

type Props = {
  date: string; // YYYY-MM-DD
  appointments: AgendaAppointment[];
  workingHours: { start_time: string; end_time: string; is_active: boolean } | null;
  onEmptySlotClick?: (localIso: string) => void;
};

const PX_PER_MIN = 1.2;
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 22;

function timeToMin(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

function minToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function AgendaDayView({ date, appointments, workingHours, onEmptySlotClick }: Props) {
  const dayStartMin = DAY_START_HOUR * 60;
  const dayEndMin = DAY_END_HOUR * 60;
  const totalMin = dayEndMin - dayStartMin;
  const totalHeight = totalMin * PX_PER_MIN;

  function handleGridClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onEmptySlotClick) return;
    // Ignora clicks que vieram de elementos interativos (links, botões, cards)
    const target = e.target as HTMLElement;
    if (target.closest('a, button')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutesFromDayStart = y / PX_PER_MIN;
    const totalMinutes = Math.max(0, Math.round(minutesFromDayStart / 15) * 15);
    const minuteOfDay = dayStartMin + totalMinutes;
    if (minuteOfDay >= dayEndMin) return;
    const h = Math.floor(minuteOfDay / 60);
    const m = minuteOfDay % 60;
    onEmptySlotClick(`${date}T${pad(h)}:${pad(m)}`);
  }

  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    for (let h = DAY_START_HOUR; h <= DAY_END_HOUR; h += 1) {
      marks.push(h * 60);
    }
    return marks;
  }, []);

  const workingStart = workingHours?.is_active ? timeToMin(workingHours.start_time) : null;
  const workingEnd = workingHours?.is_active ? timeToMin(workingHours.end_time) : null;

  function appointmentRect(apt: AgendaAppointment) {
    const startDate = new Date(apt.scheduled_start_at);
    const endDate = new Date(apt.scheduled_end_at);
    const startMin = startDate.getHours() * 60 + startDate.getMinutes();
    const endMin = endDate.getHours() * 60 + endDate.getMinutes();
    const top = Math.max(0, (startMin - dayStartMin) * PX_PER_MIN);
    const height = Math.max(24, (endMin - startMin) * PX_PER_MIN);
    return { top, height, startMin, endMin };
  }

  return (
    <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] overflow-hidden p-0">
      <div className="flex">
        <div className="border-r border-cream-dark/60" style={{ width: 64 }}>
          <div className="border-b border-cream-dark/60 px-2 py-3 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            hora
          </div>
          <div className="relative" style={{ height: totalHeight }}>
            {hourMarks.map((m) => (
              <div
                key={m}
                className="absolute left-0 right-0 -translate-y-1/2 px-2 text-right text-xs text-muted-foreground"
                style={{ top: (m - dayStartMin) * PX_PER_MIN }}
              >
                {minToLabel(m)}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="border-b border-cream-dark/60 px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Agenda do dia
          </div>
          <div
            className={onEmptySlotClick ? 'relative cursor-pointer' : 'relative'}
            style={{ height: totalHeight }}
            onClick={handleGridClick}
            role={onEmptySlotClick ? 'button' : undefined}
            tabIndex={onEmptySlotClick ? 0 : undefined}
          >
            {/* Linhas de hora */}
            {hourMarks.map((m) => (
              <div
                key={m}
                className="absolute inset-x-0 border-t border-cream-dark/40"
                style={{ top: (m - dayStartMin) * PX_PER_MIN }}
              />
            ))}

            {/* Sombrear fora do horário de trabalho */}
            {workingStart !== null && workingStart > dayStartMin ? (
              <div
                className="bg-cream/40 absolute inset-x-0"
                style={{ top: 0, height: (workingStart - dayStartMin) * PX_PER_MIN }}
              />
            ) : null}
            {workingEnd !== null && workingEnd < dayEndMin ? (
              <div
                className="bg-cream/40 absolute inset-x-0"
                style={{
                  top: (workingEnd - dayStartMin) * PX_PER_MIN,
                  height: (dayEndMin - workingEnd) * PX_PER_MIN,
                }}
              />
            ) : null}
            {!workingHours?.is_active ? (
              <div className="bg-cream/40 absolute inset-0 flex items-center justify-center">
                <p className="font-serif text-sm italic text-muted-foreground">
                  Sem expediente neste dia
                </p>
              </div>
            ) : null}

            {/* Appointments */}
            {appointments.map((apt) => {
              const { top, height, startMin, endMin } = appointmentRect(apt);
              const isCancelled = apt.status === 'cancelled' || apt.status === 'no_show';
              const canStart = !isCancelled && apt.status !== 'completed';
              return (
                <div
                  key={apt.id}
                  className={cn(
                    'group/apt absolute left-2 right-2 overflow-hidden rounded-md shadow-sm transition-shadow hover:shadow-md',
                    isCancelled && 'opacity-50',
                  )}
                  style={{
                    top,
                    height,
                    backgroundColor: `${apt.procedure_color}20`,
                    borderLeft: `3px solid ${apt.procedure_color}`,
                  }}
                >
                  <Link
                    href={`/dashboard/clientes/${apt.client_id}`}
                    className="flex h-full flex-col gap-0.5 overflow-hidden px-2 py-1.5 text-xs"
                  >
                    <span className="flex items-center gap-1 truncate font-medium text-foreground">
                      {apt.has_active_reaction ? (
                        <span
                          className="inline-flex size-3.5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"
                          title={`${apt.client_name} tem reação ativa — revisar antes do atendimento`}
                          aria-label="Cliente com reação ativa"
                        >
                          <AlertTriangle className="size-2.5" strokeWidth={2.5} />
                        </span>
                      ) : null}
                      <span className="truncate">{apt.client_name}</span>
                    </span>
                    <span className="truncate text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                      {minToLabel(startMin)} – {minToLabel(endMin)} · {apt.procedure_name}
                    </span>
                    <span className="text-[10px] text-foreground/80">
                      {formatCurrency(apt.price)}
                    </span>
                  </Link>
                  {canStart ? (
                    <Link
                      href={`/atendimento/${apt.id}`}
                      className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--gold)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-ink shadow-sm transition-all hover:scale-105 hover:shadow-md"
                      aria-label="Iniciar atendimento"
                    >
                      <Play className="size-3 fill-current" />
                      Iniciar
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
