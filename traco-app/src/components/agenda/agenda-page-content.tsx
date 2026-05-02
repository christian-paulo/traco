'use client';

import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  AgendaDayView,
  type AgendaAppointment,
} from '@/components/agenda/agenda-day-view';
import { ScheduleAppointmentDialog } from '@/components/agenda/schedule-appointment-dialog';
import { AgendaToolbar } from '@/components/agenda/agenda-toolbar';
import type { ClientLite } from '@/components/appointments/client-combobox';
import { Button } from '@/components/ui/button';
import type { ProcedureRow } from '@/lib/queries/procedures';

type Props = {
  date: string;
  appointments: AgendaAppointment[];
  workingHours: { start_time: string; end_time: string; is_active: boolean } | null;
  clients: ClientLite[];
  procedures: ProcedureRow[];
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function nextRoundedSlotLocal(date: string): string {
  // Se a data é hoje, arredonda agora pra próxima meia hora.
  // Se a data é futura, default = 09:00.
  const [y, m, d] = date.split('-').map(Number);
  const today = new Date();
  const isToday =
    today.getFullYear() === y && today.getMonth() === m - 1 && today.getDate() === d;
  if (isToday) {
    const next = new Date();
    const minutes = next.getMinutes();
    const round = minutes < 30 ? 30 : 60;
    next.setMinutes(round, 0, 0);
    if (next.getHours() < 8) next.setHours(9, 0, 0, 0);
    if (next.getHours() >= 22) next.setHours(9, 0, 0, 0);
    return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
  }
  return `${date}T09:00`;
}

export function AgendaPageContent({
  date,
  appointments,
  workingHours,
  clients,
  procedures,
}: Props) {
  const [open, setOpen] = useState(false);
  const [defaultStart, setDefaultStart] = useState<string>(() =>
    nextRoundedSlotLocal(date),
  );

  // Atalho Cmd/Ctrl + N abre novo agendamento
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setDefaultStart(nextRoundedSlotLocal(date));
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [date]);

  function handleNewClick() {
    setDefaultStart(nextRoundedSlotLocal(date));
    setOpen(true);
  }

  function handleEmptySlotClick(localIso: string) {
    setDefaultStart(localIso);
    setOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Sua semana, seu dia
        </p>
        <Button variant="premium" size="xl" onClick={handleNewClick}>
          <Plus className="size-4" />
          Novo agendamento
        </Button>
      </div>

      <AgendaToolbar currentDate={date} />

      <AgendaDayView
        date={date}
        appointments={appointments}
        workingHours={workingHours}
        onEmptySlotClick={handleEmptySlotClick}
      />

      <ScheduleAppointmentDialog
        open={open}
        onOpenChange={setOpen}
        clients={clients}
        procedures={procedures}
        defaultStartLocal={defaultStart}
      />
    </div>
  );
}
