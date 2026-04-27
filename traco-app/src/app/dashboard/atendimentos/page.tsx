import type { Metadata } from 'next';

import { AppointmentsEmptyState } from '@/components/appointments/appointments-empty-state';
import { AppointmentsTable } from '@/components/appointments/appointments-table';
import { AppointmentsToolbar } from '@/components/appointments/appointments-toolbar';
import { NewAppointmentButton } from '@/components/appointments/new-appointment-button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { listAppointments } from '@/lib/queries/appointments';
import { listClients } from '@/lib/queries/clients';
import { listProcedures } from '@/lib/queries/procedures';

export const metadata: Metadata = {
  title: 'Atendimentos | Traço',
};

type SearchParams = Promise<{ procedure?: string; from?: string; to?: string }>;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function defaultDateRange() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 30);
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return { from: fmt(start), to: fmt(today) };
}

export default async function AtendimentosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const fallback = defaultDateRange();
  const dateFrom = params.from ?? fallback.from;
  const dateTo = params.to ?? fallback.to;
  const procedureId = params.procedure ?? '';

  const fromIso = `${dateFrom}T00:00:00.000Z`;
  const toIso = `${dateTo}T23:59:59.999Z`;

  const [{ rows, total, revenue }, { rows: clientsRows }, procedures] = await Promise.all([
    listAppointments({
      procedureId: procedureId || undefined,
      dateFrom: fromIso,
      dateTo: toIso,
    }),
    listClients({}),
    listProcedures(false),
  ]);

  const clients = clientsRows.map((c) => ({ id: c.id, full_name: c.full_name, phone: c.phone }));
  const noProcedures = procedures.length === 0;
  const isEmpty = total === 0 && !procedureId && !params.from && !params.to;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-px w-8 bg-[var(--gold)]" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            Atendimentos
          </h1>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Registre cada atendimento realizado
          </p>
        </div>
        {!noProcedures && !isEmpty ? (
          <NewAppointmentButton clients={clients} procedures={procedures} />
        ) : null}
      </header>

      {noProcedures ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
          <div className="text-center">
            <p className="font-serif text-lg italic text-muted-foreground">
              Cadastre um procedimento ativo em Configurações antes de registrar atendimentos.
            </p>
          </div>
        </Card>
      ) : isEmpty ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-4">
          <AppointmentsEmptyState
            clients={clients}
            procedures={procedures}
            description="Comece registrando o primeiro procedimento realizado."
          />
        </Card>
      ) : (
        <>
          <AppointmentsToolbar
            procedures={procedures}
            initialProcedureId={procedureId}
            initialFrom={params.from ?? fallback.from}
            initialTo={params.to ?? fallback.to}
          />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {total.toLocaleString('pt-BR')}
              </span>{' '}
              {total === 1 ? 'atendimento' : 'atendimentos'}
            </span>
            <span className="text-muted-foreground">
              Faturamento no período:{' '}
              <span className="font-medium text-foreground">{formatCurrency(revenue)}</span>
            </span>
          </div>
          <Card
            variant="premium"
            className="bg-card border-0 ring-1 ring-[var(--border)] overflow-hidden p-0"
          >
            {rows.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="font-serif text-lg italic text-muted-foreground">
                  Nenhum resultado nesse período.
                </p>
              </div>
            ) : (
              <AppointmentsTable
                appointments={rows}
                clients={clients}
                procedures={procedures}
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
