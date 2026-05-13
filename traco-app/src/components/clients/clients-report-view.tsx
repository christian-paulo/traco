'use client';

import { Trophy, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { PeriodFilter } from '@/components/performance/period-filter';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, getInitials } from '@/lib/format';
import type {
  ClientReportType,
  ClientsReport,
} from '@/lib/queries/clients-report';
import { cn } from '@/lib/utils';
import type { ResolvedRange } from '@/lib/performance/period';

type Props = {
  report: ClientsReport;
  range: ResolvedRange;
};

const TYPE_LABELS: Record<ClientReportType, string> = {
  revenue: 'Receita',
  appointments: 'Atendimentos',
};

export function ClientsReportView({ report, range }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setType(type: ClientReportType) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tipo', type);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <KpiCard
          icon={<Users className="size-4" strokeWidth={1.75} />}
          label="Total de clientes"
          value={report.totalClients}
          tone="ink"
        />
        <KpiCard
          icon={<UserPlus className="size-4" strokeWidth={1.75} />}
          label="Novas no período"
          value={report.newClientsInPeriod}
          tone="gold"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Período
          </p>
          <PeriodFilter current={range} />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Ranking por
          </p>
          <div className="flex gap-2">
            {(Object.keys(TYPE_LABELS) as ClientReportType[]).map((t) => {
              const isActive = report.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-cream-dark bg-card text-foreground hover:bg-cream/60',
                  )}
                >
                  {TYPE_LABELS[t]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
        <CardContent className="px-0 py-0">
          <header className="flex flex-col gap-1 border-b border-cream-dark px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-[var(--gold)]" strokeWidth={1.75} />
              <h2 className="font-serif text-lg font-medium leading-tight text-foreground">
                Top {report.ranking.length || 30} clientes por{' '}
                {TYPE_LABELS[report.type].toLowerCase()}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">{range.label}</p>
          </header>

          {report.ranking.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <p className="font-serif italic text-muted-foreground">
                Sem atendimentos registrados no período.
              </p>
              <p className="text-xs text-muted-foreground">
                Escolha um intervalo maior pra ver suas top clientes.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-cream-dark">
              {report.ranking.map((row) => (
                <RankingRow key={row.clientId} row={row} type={report.type} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type KpiTone = 'ink' | 'gold';

function KpiCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: KpiTone;
}) {
  const toneClass = {
    ink: 'bg-foreground/[0.04] ring-foreground/10 text-foreground',
    gold: 'bg-[var(--gold)]/[0.08] ring-[var(--gold)]/30 text-[var(--gold)]',
  }[tone];
  return (
    <Card variant="premium" className={cn('border-0 ring-1', toneClass)}>
      <CardContent className="flex flex-col gap-1.5 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2 text-current">
          {icon}
          <p className="text-[10px] font-medium uppercase tracking-[0.18em]">
            {label}
          </p>
        </div>
        <p className="text-3xl font-semibold tabular-nums text-foreground sm:text-4xl">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function RankingRow({
  row,
  type,
}: {
  row: {
    rank: number;
    clientId: string;
    fullName: string;
    value: number;
    appointmentsCount: number;
  };
  type: ClientReportType;
}) {
  const isPodium = row.rank <= 3;
  const formattedValue =
    type === 'revenue'
      ? formatCurrency(row.value)
      : `${row.value} ${row.value === 1 ? 'atendimento' : 'atendimentos'}`;

  return (
    <li>
      <Link
        href={`/dashboard/clientes/${row.clientId}`}
        className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-cream/40 sm:px-6"
      >
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums',
            isPodium
              ? 'bg-[var(--gold)] text-foreground'
              : 'bg-cream-dark text-muted-foreground',
          )}
          aria-label={`Posição ${row.rank}`}
        >
          {row.rank}
        </span>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream text-[11px] font-medium text-[var(--gold)] ring-1 ring-[var(--gold)]/30">
          {getInitials(row.fullName)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-sm font-medium text-foreground">{row.fullName}</p>
          {type === 'revenue' ? (
            <p className="text-[11px] text-muted-foreground">
              {row.appointmentsCount}{' '}
              {row.appointmentsCount === 1 ? 'atendimento' : 'atendimentos'}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {formattedValue}
        </span>
      </Link>
    </li>
  );
}
