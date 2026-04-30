import type { Metadata } from 'next';

import { AgendaPageContent } from '@/components/agenda/agenda-page-content';
import type { AgendaAppointment } from '@/components/agenda/agenda-day-view';
import { Card, CardContent } from '@/components/ui/card';
import { listClients } from '@/lib/queries/clients';
import { getClientsWithActiveReactionIds } from '@/lib/queries/dashboard';
import { listProcedures } from '@/lib/queries/procedures';
import { getCurrentProfessional, listWorkingHours } from '@/lib/queries/studio';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Agenda',
};

type SearchParams = Promise<{ date?: string }>;

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function fmt(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default async function AgendaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const today = fmt(new Date());
  const date = params.date ?? today;

  const professional = await getCurrentProfessional();

  if (!professional) {
    return (
      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-2">
          <div className="h-px w-8 bg-[var(--gold)]" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">Agenda</h1>
        </header>
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
          <CardContent className="text-center">
            <p className="font-serif text-lg italic text-muted-foreground">
              Studio não configurado. Aplique a migração 03 e recarregue.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const [
    { data: appts },
    hours,
    clientsWithReactions,
    { rows: clientsRows },
    procedures,
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select(
        'id, client_id, scheduled_start_at, scheduled_end_at, status, price, clients(full_name), procedures(name, color)',
      )
      .eq('professional_id', professional.id)
      .gte('scheduled_start_at', dayStart)
      .lte('scheduled_start_at', dayEnd)
      .order('scheduled_start_at', { ascending: true }),
    listWorkingHours(professional.id),
    getClientsWithActiveReactionIds(),
    listClients({}),
    listProcedures(false),
  ]);

  type Raw = {
    id: string;
    client_id: string;
    scheduled_start_at: string | null;
    scheduled_end_at: string | null;
    status: string;
    price: number | null;
    clients: { full_name: string } | { full_name: string }[] | null;
    procedures: { name: string; color: string } | { name: string; color: string }[] | null;
  };
  function pickOne<T>(v: T | T[] | null | undefined): T | null {
    if (!v) return null;
    return Array.isArray(v) ? (v[0] ?? null) : v;
  }

  const appointments: AgendaAppointment[] = (appts ?? [])
    .map((raw) => {
      const r = raw as unknown as Raw;
      if (!r.scheduled_start_at || !r.scheduled_end_at) return null;
      const client = pickOne(r.clients);
      const proc = pickOne(r.procedures);
      return {
        id: r.id,
        client_id: r.client_id,
        client_name: client?.full_name ?? 'Cliente',
        procedure_name: proc?.name ?? 'Procedimento',
        procedure_color: proc?.color ?? '#C9A961',
        scheduled_start_at: r.scheduled_start_at,
        scheduled_end_at: r.scheduled_end_at,
        status: r.status,
        price: Number(r.price ?? 0),
        has_active_reaction: clientsWithReactions.has(r.client_id),
      } satisfies AgendaAppointment;
    })
    .filter((v): v is AgendaAppointment => v !== null);

  const dow = new Date(`${date}T00:00:00`).getDay();
  const todayHours = hours.find((h) => h.day_of_week === dow) ?? null;

  const clients = clientsRows.map((c) => ({
    id: c.id,
    full_name: c.full_name,
    phone: c.phone,
  }));

  return (
    <div className="flex flex-col gap-8">
      <AgendaPageContent
        date={date}
        appointments={appointments}
        workingHours={
          todayHours
            ? {
                start_time: todayHours.start_time,
                end_time: todayHours.end_time,
                is_active: todayHours.is_active,
              }
            : null
        }
        clients={clients}
        procedures={procedures}
      />
    </div>
  );
}
