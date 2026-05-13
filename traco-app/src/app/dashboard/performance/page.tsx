import type { Metadata } from 'next';

import { BalanceCard } from '@/components/performance/balance-card';
import { EffortCard } from '@/components/performance/effort-card';
import { PeriodFilter } from '@/components/performance/period-filter';
import {
  isPeriodPreset,
  resolvePeriod,
  type PeriodPreset,
} from '@/lib/performance/period';
import { getPerformanceMetrics } from '@/lib/queries/performance';

export const metadata: Metadata = {
  title: 'Performance',
};

type SearchParams = Promise<{
  range?: string;
  from?: string;
  to?: string;
}>;

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const preset: PeriodPreset | undefined = isPeriodPreset(params.range)
    ? params.range
    : 'mes-atual';
  const range = resolvePeriod(preset, params.from, params.to);
  const metrics = await getPerformanceMetrics(range.fromIso, range.toIso);

  const shareParams = new URLSearchParams({
    type: 'monthly',
    from: range.fromDate,
    to: range.toDate,
  });
  const shareHref = `/dashboard/compartilhar?${shareParams.toString()}`;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="h-px w-8 bg-[var(--gold)]" />
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Performance
        </h1>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Receita, despesas e esforço no período
        </p>
      </header>

      <PeriodFilter current={range} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <BalanceCard
          revenue={metrics.revenue}
          expenses={metrics.expenses}
          profit={metrics.profit}
        />
        <EffortCard
          daysWithAppointments={metrics.daysWithAppointments}
          appointmentsCount={metrics.appointmentsCount}
          uniqueClients={metrics.uniqueClients}
          totalMinutes={metrics.totalMinutes}
          shareHref={shareHref}
        />
      </div>
    </div>
  );
}
