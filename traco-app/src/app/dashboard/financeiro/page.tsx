import {
  ArrowDown,
  CalendarCheck,
  Crown,
  PiggyBank,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { DateRangePicker } from '@/components/financial/date-range-picker';
import { DayOfWeekChart } from '@/components/financial/day-of-week-chart';
import { ExpensesPieChart } from '@/components/financial/expenses-pie-chart';
import { MetricCard } from '@/components/financial/metric-card';
import { ProcedurePieChart } from '@/components/financial/procedure-pie-chart';
import { RevenueLineChart } from '@/components/financial/revenue-line-chart';
import { RevenueVsExpenseChart } from '@/components/financial/revenue-vs-expense-chart';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatRelativeDate, getInitials } from '@/lib/format';
import {
  getExpenseSummary,
  getMonthlyExpenseComparison,
} from '@/lib/queries/expenses';
import {
  getMonthlyRevenueComparison,
  getRevenueByDayOfWeek,
  getRevenueComparison,
  getRevenueOverview,
  getTopClients,
} from '@/lib/queries/financial';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Financeiro',
};

type SearchParams = Promise<{ from?: string; to?: string }>;

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function fmt(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function defaultRange() {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 29);
  return { from: fmt(from), to: fmt(today) };
}

export default async function FinanceiroPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const fallback = defaultRange();
  const dateFrom = params.from ?? fallback.from;
  const dateTo = params.to ?? fallback.to;
  const fromIso = `${dateFrom}T00:00:00.000Z`;
  const toIso = `${dateTo}T23:59:59.999Z`;

  const [
    overview,
    comparison,
    monthly,
    topClients,
    byDay,
    expenseSummary,
    monthlyExpenses,
  ] = await Promise.all([
    getRevenueOverview({ from: fromIso, to: toIso }),
    getRevenueComparison({ from: fromIso, to: toIso }),
    getMonthlyRevenueComparison(6),
    getTopClients({ limit: 10, from: fromIso, to: toIso }),
    getRevenueByDayOfWeek({ from: fromIso, to: toIso }),
    getExpenseSummary({ from: dateFrom, to: dateTo }),
    getMonthlyExpenseComparison(6),
  ]);

  // Receita vs despesa por mês (combina os dois arrays)
  const expenseByMonth = new Map(monthlyExpenses.map((e) => [e.month, e.amount]));
  const comparisonChart = monthly.map((m) => {
    const expenses = expenseByMonth.get(m.month) ?? 0;
    const profit = m.revenue - expenses;
    return { label: m.label, revenue: m.revenue, expenses, profit };
  });

  const profit = overview.totalRevenue - expenseSummary.total;
  const margin =
    overview.totalRevenue > 0 ? (profit / overview.totalRevenue) * 100 : 0;
  const marginTone =
    margin >= 50 ? 'positive' : margin >= 30 ? 'neutral' : 'negative';

  const revenueParts = (() => {
    const formatted = formatCurrency(overview.totalRevenue);
    const match = formatted.match(/^(R\$)\s*(.+)$/);
    return match ? { prefix: match[1], value: match[2] } : { prefix: undefined, value: formatted };
  })();
  const ticketParts = (() => {
    const formatted = formatCurrency(overview.averageTicket);
    const match = formatted.match(/^(R\$)\s*(.+)$/);
    return match ? { prefix: match[1], value: match[2] } : { prefix: undefined, value: formatted };
  })();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-px w-8 bg-[var(--gold)]" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            Financeiro
          </h1>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Entenda seu faturamento
          </p>
        </div>
        <DateRangePicker initialFrom={dateFrom} initialTo={dateTo} />
      </header>

      {/* SEÇÃO 1 — Cards principais */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Faturamento total"
          icon={TrendingUp}
          prefix={revenueParts.prefix}
          value={revenueParts.value}
          delta={{ pct: comparison.deltaPct }}
        />
        <MetricCard
          label="Atendimentos"
          icon={CalendarCheck}
          value={overview.totalAppointments.toLocaleString('pt-BR')}
        />
        <MetricCard
          label="Ticket médio"
          icon={Receipt}
          prefix={ticketParts.prefix}
          value={ticketParts.value}
        />
        <MetricCard
          label="Mais lucrativo"
          icon={Crown}
          value={overview.topProcedure?.name ?? '—'}
          delta={
            overview.topProcedure
              ? { pct: overview.topProcedure.percentage, label: 'do total' }
              : undefined
          }
          highlight="positive"
        />
      </section>

      {/* SEÇÃO 1B — Receita vs despesa + lucro + margem */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card variant="premium" className="bg-card border-0 ring-1 ring-emerald-200 py-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Receita
            </CardTitle>
            <TrendingUp className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="px-6">
            <p className="font-serif text-3xl font-medium text-emerald-700">
              {formatCurrency(overview.totalRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card variant="premium" className="bg-card border-0 ring-1 ring-red-200 py-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Despesa
            </CardTitle>
            <ArrowDown className="size-4 text-red-600" />
          </CardHeader>
          <CardContent className="px-6">
            <p className="font-serif text-3xl font-medium text-red-700">
              {formatCurrency(expenseSummary.total)}
            </p>
            {expenseSummary.topCategory ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Maior: {expenseSummary.topCategory.label}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card
          variant="premium"
          className={cn(
            'bg-card border-0 py-6',
            marginTone === 'positive'
              ? 'ring-1 ring-emerald-300'
              : marginTone === 'neutral'
                ? 'ring-1 ring-amber-300'
                : 'ring-1 ring-red-300',
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Margem de lucro
            </CardTitle>
            <PiggyBank
              className={cn(
                'size-4',
                marginTone === 'positive'
                  ? 'text-emerald-600'
                  : marginTone === 'neutral'
                    ? 'text-amber-600'
                    : 'text-red-600',
              )}
            />
          </CardHeader>
          <CardContent className="px-6">
            <p
              className={cn(
                'font-serif text-3xl font-medium',
                marginTone === 'positive'
                  ? 'text-emerald-700'
                  : marginTone === 'neutral'
                    ? 'text-amber-700'
                    : 'text-red-700',
              )}
            >
              {overview.totalRevenue > 0 ? `${margin.toFixed(1)}%` : '—'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Lucro {formatCurrency(profit)}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* SEÇÃO 2 — Gráficos */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
          <CardHeader className="px-6 pb-2">
            <div className="mb-3 h-px w-6 bg-[var(--gold)]" />
            <CardTitle className="font-serif text-xl font-medium">Evolução do faturamento</CardTitle>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Últimos 6 meses
            </p>
          </CardHeader>
          <CardContent className="px-2 pt-2 sm:px-4">
            <RevenueLineChart data={monthly} />
          </CardContent>
        </Card>

        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
          <CardHeader className="px-6 pb-2">
            <div className="mb-3 h-px w-6 bg-[var(--gold)]" />
            <CardTitle className="font-serif text-xl font-medium">Receita por procedimento</CardTitle>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              No período selecionado
            </p>
          </CardHeader>
          <CardContent className="px-6 pt-2">
            <ProcedurePieChart data={overview.byProcedure} total={overview.totalRevenue} />
          </CardContent>
        </Card>
      </section>

      {/* SEÇÃO 2B — Receita vs despesa por mês + Top categorias de despesa */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
          <CardHeader className="px-6 pb-2">
            <div className="mb-3 h-px w-6 bg-[var(--gold)]" />
            <CardTitle className="font-serif text-xl font-medium">
              Receita vs despesa
            </CardTitle>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Últimos 6 meses
            </p>
          </CardHeader>
          <CardContent className="px-2 pt-2 sm:px-4">
            <RevenueVsExpenseChart data={comparisonChart} />
          </CardContent>
        </Card>

        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
          <CardHeader className="px-6 pb-2">
            <div className="mb-3 h-px w-6 bg-[var(--gold)]" />
            <CardTitle className="font-serif text-xl font-medium">
              Top categorias de despesa
            </CardTitle>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              No período selecionado
            </p>
          </CardHeader>
          <CardContent className="px-6 pt-2">
            <ExpensesPieChart
              data={expenseSummary.byCategory}
              total={expenseSummary.total}
            />
          </CardContent>
        </Card>
      </section>

      {/* SEÇÃO 3 — Top clientes */}
      <section>
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] overflow-hidden p-0">
          <CardHeader className="px-6 pt-6 pb-4">
            <div className="mb-3 h-px w-6 bg-[var(--gold)]" />
            <CardTitle className="font-serif text-xl font-medium">Top clientes</CardTitle>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Por receita gerada no período
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {topClients.length === 0 ? (
              <p className="px-6 pb-6 font-serif italic text-muted-foreground">
                Nenhum atendimento no período selecionado.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Atendimentos</TableHead>
                    <TableHead>Total gasto</TableHead>
                    <TableHead>Última visita</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topClients.map((c, idx) => (
                    <TableRow
                      key={c.client_id}
                      className="hover:bg-cream-dark/40 transition-colors"
                    >
                      <TableCell className="font-serif text-base text-[var(--gold)]">
                        #{idx + 1}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/clientes/${c.client_id}`}
                          className="flex items-center gap-2 font-medium hover:text-[var(--gold)]"
                        >
                          <Avatar className="size-7 border border-[var(--gold)]/30">
                            <AvatarFallback className="bg-cream text-[var(--gold)] text-[11px] font-medium">
                              {getInitials(c.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          {c.full_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.appointments_count}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {formatCurrency(c.total_revenue)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatRelativeDate(c.last_visit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* SEÇÃO 4 — Dia da semana */}
      <section>
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
          <CardHeader className="px-6 pb-2">
            <div className="mb-3 h-px w-6 bg-[var(--gold)]" />
            <CardTitle className="font-serif text-xl font-medium">
              Faturamento por dia da semana
            </CardTitle>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Onde concentrar a agenda
            </p>
          </CardHeader>
          <CardContent className="px-2 pt-2 sm:px-4">
            <DayOfWeekChart data={byDay} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
