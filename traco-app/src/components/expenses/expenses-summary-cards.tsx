import { ArrowDown, BarChart3, TrendingDown } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import type { ExpenseSummary } from '@/lib/queries/expenses';

type Props = {
  summary: ExpenseSummary;
};

export function ExpensesSummaryCards({ summary }: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card variant="premium" className="bg-card border-0 ring-1 ring-red-200 py-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Total no período
          </CardTitle>
          <ArrowDown className="size-4 text-red-600" />
        </CardHeader>
        <CardContent className="px-6">
          <p className="font-serif text-3xl font-medium text-red-700">
            {formatCurrency(summary.total)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.count} {summary.count === 1 ? 'lançamento' : 'lançamentos'}
          </p>
        </CardContent>
      </Card>

      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Média mensal
          </CardTitle>
          <TrendingDown className="size-4 text-[var(--gold)]" />
        </CardHeader>
        <CardContent className="px-6">
          <p className="font-serif text-3xl font-medium text-foreground">
            {formatCurrency(summary.averageMonthly)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">No período selecionado</p>
        </CardContent>
      </Card>

      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Maior categoria
          </CardTitle>
          <BarChart3 className="size-4 text-[var(--gold)]" />
        </CardHeader>
        <CardContent className="px-6">
          {summary.topCategory ? (
            <>
              <p className="font-serif text-2xl font-medium text-foreground">
                {summary.topCategory.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatCurrency(summary.topCategory.amount)}
              </p>
            </>
          ) : (
            <p className="font-serif text-base italic text-muted-foreground">
              Sem despesas no período
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
