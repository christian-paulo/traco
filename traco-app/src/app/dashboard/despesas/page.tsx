import type { Metadata } from 'next';

import { ExpensesSummaryCards } from '@/components/expenses/expenses-summary-cards';
import { ExpensesTable } from '@/components/expenses/expenses-table';
import { ExpensesToolbar } from '@/components/expenses/expenses-toolbar';
import { ExportButton } from '@/components/expenses/export-button';
import { NewExpenseButton } from '@/components/expenses/new-expense-button';
import { getExpenseSummary, listExpenses } from '@/lib/queries/expenses';
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from '@/lib/validations/expense';

export const metadata: Metadata = {
  title: 'Despesas',
};

type SearchParams = Promise<{
  from?: string;
  to?: string;
  cat?: string;
  q?: string;
}>;

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

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const fallback = defaultRange();
  const dateFrom = params.from ?? fallback.from;
  const dateTo = params.to ?? fallback.to;
  const category: ExpenseCategory | 'all' = isCategory(params.cat) ? params.cat : 'all';
  const search = (params.q ?? '').trim();

  const [expenses, summary] = await Promise.all([
    listExpenses({
      from: dateFrom,
      to: dateTo,
      category,
      search: search || undefined,
    }),
    getExpenseSummary({ from: dateFrom, to: dateTo }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-px w-8 bg-[var(--gold)]" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            Despesas
          </h1>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Suas saídas, sob controle
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton from={dateFrom} to={dateTo} />
          <NewExpenseButton />
        </div>
      </header>

      <ExpensesToolbar
        initialFrom={dateFrom}
        initialTo={dateTo}
        initialCategory={category}
        initialSearch={search}
      />

      <ExpensesSummaryCards summary={summary} />

      <ExpensesTable expenses={expenses} />
    </div>
  );
}
