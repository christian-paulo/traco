'use client';

import { AppointmentsEmptyState } from '@/components/appointments/appointments-empty-state';
import { AppointmentsTable } from '@/components/appointments/appointments-table';
import { AppointmentsToolbar } from '@/components/appointments/appointments-toolbar';
import { NewAppointmentButton } from '@/components/appointments/new-appointment-button';
import type { ClientLite } from '@/components/appointments/client-combobox';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import type { AppointmentRow } from '@/lib/queries/appointments';
import type { ProcedureRow } from '@/lib/queries/procedures';

type Props = {
  rows: AppointmentRow[];
  total: number;
  revenue: number;
  clients: ClientLite[];
  procedures: ProcedureRow[];
  procedureId: string;
  dateFrom: string;
  dateTo: string;
  hasFilters: boolean;
};

export function HistoricoView({
  rows,
  total,
  revenue,
  clients,
  procedures,
  procedureId,
  dateFrom,
  dateTo,
  hasFilters,
}: Props) {
  const noProcedures = procedures.length === 0;
  const isEmpty = total === 0 && !hasFilters;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Atendimentos realizados
        </p>
        {!noProcedures && !isEmpty ? (
          <NewAppointmentButton clients={clients} procedures={procedures} />
        ) : null}
      </div>

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
            initialFrom={dateFrom}
            initialTo={dateTo}
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
