import type { Metadata } from 'next';

import { ClientsEmptyState } from '@/components/clients/clients-empty-state';
import { ClientsFilterPills } from '@/components/clients/clients-filter-pills';
import { ClientsMissingView } from '@/components/clients/clients-missing-view';
import { ClientsReportView } from '@/components/clients/clients-report-view';
import { ClientsReturnView } from '@/components/clients/clients-return-view';
import { ClientsTable } from '@/components/clients/clients-table';
import { ClientsToolbar } from '@/components/clients/clients-toolbar';
import { NewClientButton } from '@/components/clients/new-client-button';
import { RecuperarList } from '@/components/recuperar/recuperar-list';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import {
  getClientsToRecover,
  listAllTags,
  listClients,
} from '@/lib/queries/clients';
import {
  getClientsForReturn,
  getMissingClients,
} from '@/lib/queries/clients-followup';
import {
  getClientsReport,
  type ClientReportType,
} from '@/lib/queries/clients-report';
import {
  getDefaultMessageTemplate,
} from '@/lib/queries/message-templates';
import {
  isPeriodPreset,
  resolvePeriod,
  type PeriodPreset,
} from '@/lib/performance/period';
import { listProcedures } from '@/lib/queries/procedures';
import { getCurrentProfile } from '@/lib/queries/profile';
import { getCurrentStudio } from '@/lib/queries/studio';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Clientes | Traço',
};

type SearchParams = Promise<{
  search?: string;
  tag?: string;
  filtro?: string;
  range?: string;
  from?: string;
  to?: string;
  tipo?: string;
  dias?: string;
  procedimento?: string;
  min?: string;
}>;

type ClientsFilter = 'todas' | 'retornos' | 'sumidos' | 'recuperar' | 'relatorios';

function parseFiltro(v: string | undefined): ClientsFilter {
  if (
    v === 'retornos' ||
    v === 'sumidos' ||
    v === 'recuperar' ||
    v === 'relatorios'
  ) {
    return v;
  }
  return 'todas';
}

function parseIntOr(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const DEFAULT_WHATSAPP_TEMPLATE =
  'Olá! Vi que faz {dias} dias do meu último {procedimento}. Gostaria de agendar meu retorno.';

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = params.search ?? '';
  const tag = params.tag ?? '';
  const filtro = parseFiltro(params.filtro);

  if (filtro === 'retornos') {
    const days = parseIntOr(params.dias, 30);
    const procedureId = params.procedimento || null;
    const profile = await getCurrentProfile();
    const studio = await getCurrentStudio();
    const [rows, procedures, reminderTemplate, recoverClients] = await Promise.all([
      getClientsForReturn({
        daysAfter: days,
        procedureId: procedureId ?? undefined,
        windowDays: 14,
      }),
      listProcedures(false),
      getDefaultMessageTemplate('reminder'),
      getClientsToRecover(),
    ]);

    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <div className="h-px w-8 bg-[var(--gold)]" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Retornos — quem está chegando a hora de voltar
          </p>
        </header>

        <ClientsFilterPills recoverCount={recoverClients.length} active="retornos" />

        <ClientsReturnView
          rows={rows}
          procedures={procedures}
          selectedDays={days}
          selectedProcedureId={procedureId}
          reminderTemplate={reminderTemplate?.body ?? null}
          studioName={studio?.name ?? null}
          studioAddress={studio?.address ?? null}
          designerName={profile?.fullName ?? null}
        />
      </div>
    );
  }

  if (filtro === 'sumidos') {
    const days = parseIntOr(params.dias, 60);
    const minAppts = parseIntOr(params.min, 2);
    const profile = await getCurrentProfile();
    const studio = await getCurrentStudio();
    const [rows, recoveryTemplate, recoverClients] = await Promise.all([
      getMissingClients({ minDaysSinceLast: days, minAppointments: minAppts }),
      getDefaultMessageTemplate('recovery'),
      getClientsToRecover(),
    ]);

    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <div className="h-px w-8 bg-[var(--gold)]" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Sumidas — fiéis que pararam de aparecer
          </p>
        </header>

        <ClientsFilterPills recoverCount={recoverClients.length} active="sumidos" />

        <ClientsMissingView
          rows={rows}
          selectedDays={days}
          selectedMinAppointments={minAppts}
          recoveryTemplate={recoveryTemplate?.body ?? null}
          studioName={studio?.name ?? null}
          studioAddress={studio?.address ?? null}
          designerName={profile?.fullName ?? null}
        />
      </div>
    );
  }

  if (filtro === 'relatorios') {
    const preset: PeriodPreset = isPeriodPreset(params.range)
      ? params.range
      : 'mes-atual';
    const range = resolvePeriod(preset, params.from, params.to);
    const type: ClientReportType =
      params.tipo === 'appointments' ? 'appointments' : 'revenue';
    const [report, recoverClients] = await Promise.all([
      getClientsReport(range.fromIso, range.toIso, type),
      getClientsToRecover(),
    ]);

    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <div className="h-px w-8 bg-[var(--gold)]" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Relatórios — quem mais gera receita e atendimentos
          </p>
        </header>

        <ClientsFilterPills recoverCount={recoverClients.length} active="relatorios" />

        <ClientsReportView report={report} range={range} />
      </div>
    );
  }

  if (filtro === 'recuperar') {
    const profile = await getCurrentProfile();
    const supabase = await createClient();
    const [recoverClients, recoveryTemplate, tenantRow] = await Promise.all([
      getClientsToRecover(),
      getDefaultMessageTemplate('recovery'),
      profile
        ? supabase
            .from('tenants')
            .select('whatsapp_template')
            .eq('id', profile.tenantId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const whatsappTemplate =
      recoveryTemplate?.body ??
      tenantRow?.data?.whatsapp_template ??
      DEFAULT_WHATSAPP_TEMPLATE;
    const totalToRecover = recoverClients.length;
    const potentialRevenue = recoverClients.reduce(
      (s, c) => s + c.last_procedure_default_price,
      0,
    );
    const mostOverdue = recoverClients[0]?.days_overdue ?? 0;

    return (
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <div className="h-px w-8 bg-[var(--gold)]" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Em recuperação — clientes que deveriam ter voltado
          </p>
        </header>

        <ClientsFilterPills recoverCount={totalToRecover} active="recuperar" />

        {totalToRecover > 0 ? (
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-5">
            <CardContent className="grid grid-cols-1 gap-6 px-6 sm:grid-cols-3">
              <Stat label="Total a recuperar" value={String(totalToRecover)} />
              <Stat label="Receita potencial" value={formatCurrency(potentialRevenue)} />
              <Stat label="Mais atrasada" value={`${mostOverdue} dias`} />
            </CardContent>
          </Card>
        ) : null}

        <RecuperarList clients={recoverClients} whatsappTemplate={whatsappTemplate} />
      </div>
    );
  }

  const [{ rows, total }, tags, recoverClients] = await Promise.all([
    listClients({ search, tag }),
    listAllTags(),
    getClientsToRecover(),
  ]);

  const hasFilters = search.length > 0 || tag.length > 0;
  const hasNoData = total === 0 && !hasFilters;
  const recoverCount = recoverClients.length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-px w-8 bg-[var(--gold)]" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Gerencie suas clientes
          </p>
        </div>
        {hasNoData ? null : <NewClientButton />}
      </header>

      {hasNoData ? null : (
        <ClientsFilterPills recoverCount={recoverCount} active="todas" />
      )}

      {hasNoData ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-4">
          <ClientsEmptyState />
        </Card>
      ) : (
        <>
          <ClientsToolbar initialSearch={search} initialTag={tag} availableTags={tags} />
          <p className="text-xs text-muted-foreground">
            {total === 0
              ? 'Nenhuma cliente encontrada com esses filtros.'
              : `${total.toLocaleString('pt-BR')} ${total === 1 ? 'cliente cadastrada' : 'clientes cadastradas'}`}
          </p>
          <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] overflow-hidden p-0">
            {rows.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="font-serif text-lg italic text-muted-foreground">
                  Nenhum resultado.
                </p>
              </div>
            ) : (
              <ClientsTable clients={rows} />
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="font-serif text-2xl font-medium text-foreground">{value}</span>
    </div>
  );
}
