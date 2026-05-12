'use client';

import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  AgendaDayView,
  type AgendaAppointment,
} from '@/components/agenda/agenda-day-view';
import { AppointmentDetailsSheet } from '@/components/agenda/appointment-details-sheet';
import {
  ScheduleAppointmentDialog,
  type EditingAppointment,
} from '@/components/agenda/schedule-appointment-dialog';
import { AgendaToolbar } from '@/components/agenda/agenda-toolbar';
import type { ClientLite } from '@/components/appointments/client-combobox';
import { Button } from '@/components/ui/button';
import type { MessageTemplateRow } from '@/lib/queries/message-templates';
import type { ProcedureRow } from '@/lib/queries/procedures';

type Props = {
  date: string;
  appointments: AgendaAppointment[];
  workingHours: { start_time: string; end_time: string; is_active: boolean } | null;
  clients: ClientLite[];
  procedures: ProcedureRow[];
  messageTemplates: MessageTemplateRow[];
  designerName: string | null;
  studioName: string | null;
  studioAddress: string | null;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function nextRoundedSlotLocal(date: string): string {
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
  messageTemplates,
  designerName,
  studioName,
  studioAddress,
}: Props) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [defaultStart, setDefaultStart] = useState<string>(() =>
    nextRoundedSlotLocal(date),
  );
  const [editing, setEditing] = useState<EditingAppointment | null>(null);
  const [detailsApt, setDetailsApt] = useState<AgendaAppointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
        setEditing(null);
        setDefaultStart(nextRoundedSlotLocal(date));
        setScheduleOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [date]);

  function handleNewClick() {
    setEditing(null);
    setDefaultStart(nextRoundedSlotLocal(date));
    setScheduleOpen(true);
  }

  function handleEmptySlotClick(localIso: string) {
    setEditing(null);
    setDefaultStart(localIso);
    setScheduleOpen(true);
  }

  function handleAppointmentClick(apt: AgendaAppointment) {
    setDetailsApt(apt);
    setDetailsOpen(true);
  }

  function handleEditFromDetails(apt: AgendaAppointment) {
    setDetailsOpen(false);
    setEditing({
      id: apt.id,
      client_id: apt.client_id,
      procedure_id: apt.procedure_id,
      scheduled_start_at: apt.scheduled_start_at,
      scheduled_end_at: apt.scheduled_end_at,
      price: apt.price,
      notes: apt.notes,
    });
    setScheduleOpen(true);
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
        onAppointmentClick={handleAppointmentClick}
      />

      <ScheduleAppointmentDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        clients={clients}
        procedures={procedures}
        defaultStartLocal={defaultStart}
        editing={editing}
      />

      <AppointmentDetailsSheet
        appointment={detailsApt}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={handleEditFromDetails}
        messageTemplates={messageTemplates}
        designerName={designerName}
        studioName={studioName}
        studioAddress={studioAddress}
      />
    </div>
  );
}
