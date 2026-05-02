import type { Metadata } from 'next';

import { FinanceiroTabs } from '@/components/financial/financeiro-tabs';
import {
  getExpenseSummary,
  getMonthlyExpenseComparison,
  listExpenses,
} from '@/lib/queries/expenses';
import {
  getMonthlyRevenueComparison,
  getRevenueByDayOfWeek,
  getRevenueComparison,
  getRevenueOverview,
  getTopClients,
} from '@/lib/queries/financial';
import {
  listAchievements,
  listAllGoals,
  markAllAchievementsSeenInline,
} from '@/lib/queries/goals';
import { refreshAllGoalsProgress } from '@/server/actions/goals';
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from '@/lib/validations/expense';

export const metadata: Metadata = {
  title: 'Financeiro',
};

type SearchParams = Promise<{
  tab?: string;
  from?: string;
  to?: string;
  cat?: string;
  q?: string;
}>;

type Tab = 'receita' | 'despesas' | 'metas';

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
function isCategory(v: string | undefined): v is ExpenseCategory {
  if (!v) return false;
  return (EXPENSE_CATEGORIES as readonly string[]).includes(v);
}
function parseTab(v: string | undefined): Tab {
  if (v === 'despesas' || v === 'metas') return v;
  return 'receita';
}

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const fallback = defaultRange();
  const dateFrom = params.from ?? fallback.from;
  const dateTo = params.to ?? fallback.to;
  const expenseCategory: ExpenseCategory | 'all' = isCategory(params.cat)
    ? params.cat
    : 'all';
  const expenseSearch = (params.q ?? '').trim();
  const fromIso = `${dateFrom}T00:00:00.000Z`;
  const toIso = `${dateTo}T23:59:59.999Z`;

  // Refresh + mark-seen rodam em paralelo, sem bloquear o fetch dos dados de leitura.
  // Trigger SQL `appointments_refresh_goals` (migration 06) mantém current_value
  // fresco em ~todos casos comuns, então uma raça leve aqui não causa staleness visível.
  const [
    ,
    ,
    overview,
    comparison,
    monthly,
    topClients,
    byDay,
    expenseSummary,
    monthlyExpenses,
    expenses,
    goals,
    achievements,
  ] = await Promise.all([
    refreshAllGoalsProgress(),
    markAllAchievementsSeenInline(),
    getRevenueOverview({ from: fromIso, to: toIso }),
    getRevenueComparison({ from: fromIso, to: toIso }),
    getMonthlyRevenueComparison(6),
    getTopClients({ limit: 10, from: fromIso, to: toIso }),
    getRevenueByDayOfWeek({ from: fromIso, to: toIso }),
    getExpenseSummary({ from: dateFrom, to: dateTo }),
    getMonthlyExpenseComparison(6),
    listExpenses({
      from: dateFrom,
      to: dateTo,
      category: expenseCategory,
      search: expenseSearch || undefined,
    }),
    listAllGoals(),
    listAchievements(),
  ]);

  // Receita vs despesa por mês
  const expenseByMonth = new Map(monthlyExpenses.map((e) => [e.month, e.amount]));
  const comparisonChart = monthly.map((m) => {
    const monthExpenses = expenseByMonth.get(m.month) ?? 0;
    const profit = m.revenue - monthExpenses;
    return { label: m.label, revenue: m.revenue, expenses: monthExpenses, profit };
  });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="h-px w-8 bg-[var(--gold)]" />
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Financeiro
        </h1>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Receita, despesas e metas em um lugar só
        </p>
      </header>

      <FinanceiroTabs
        initialTab={tab}
        dateFrom={dateFrom}
        dateTo={dateTo}
        overview={overview}
        comparison={comparison}
        monthly={monthly}
        comparisonChart={comparisonChart}
        expenseSummary={expenseSummary}
        topClients={topClients}
        byDay={byDay}
        expenses={expenses}
        expenseCategory={expenseCategory}
        expenseSearch={expenseSearch}
        goals={goals}
        achievements={achievements}
      />
    </div>
  );
}
