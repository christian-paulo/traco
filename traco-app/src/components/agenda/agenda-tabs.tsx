'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { AgendaPageContent } from '@/components/agenda/agenda-page-content';
import type { AgendaAppointment } from '@/components/agenda/agenda-day-view';
import type { ClientLite } from '@/components/appointments/client-combobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AppointmentRow } from '@/lib/queries/appointments';
import type { MessageTemplateRow } from '@/lib/queries/message-templates';
import type { ProcedureRow } from '@/lib/queries/procedures';

import { HistoricoView } from './views/historico-view';

type Tab = 'calendario' | 'historico';

type Props = {
  initialTab: Tab;
  // Calendário
  date: string;
  appointments: AgendaAppointment[];
  workingHours: { start_time: string; end_time: string; is_active: boolean } | null;
  clients: ClientLite[];
  procedures: ProcedureRow[];
  messageTemplates: MessageTemplateRow[];
  designerName: string | null;
  studioName: string | null;
  studioAddress: string | null;
  // Histórico
  historicoRows: AppointmentRow[];
  historicoTotal: number;
  historicoRevenue: number;
  historicoFrom: string;
  historicoTo: string;
  historicoProcedureId: string;
  historicoHasFilters: boolean;
};

export function AgendaTabs(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function handleTabChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <Tabs value={props.initialTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="calendario">Calendário</TabsTrigger>
        <TabsTrigger value="historico">Histórico</TabsTrigger>
      </TabsList>

      <TabsContent value="calendario" className="mt-6">
        <AgendaPageContent
          date={props.date}
          appointments={props.appointments}
          workingHours={props.workingHours}
          clients={props.clients}
          procedures={props.procedures}
          messageTemplates={props.messageTemplates}
          designerName={props.designerName}
          studioName={props.studioName}
          studioAddress={props.studioAddress}
        />
      </TabsContent>

      <TabsContent value="historico" className="mt-6">
        <HistoricoView
          rows={props.historicoRows}
          total={props.historicoTotal}
          revenue={props.historicoRevenue}
          clients={props.clients}
          procedures={props.procedures}
          procedureId={props.historicoProcedureId}
          dateFrom={props.historicoFrom}
          dateTo={props.historicoTo}
          hasFilters={props.historicoHasFilters}
        />
      </TabsContent>
    </Tabs>
  );
}
