'use client';

import { ExpensesSummaryCards } from '@/components/expenses/expenses-summary-cards';
import { ExpensesTable } from '@/components/expenses/expenses-table';
import { ExpensesToolbar } from '@/components/expenses/expenses-toolbar';
import { ExportButton } from '@/components/expenses/export-button';
import { NewExpenseButton } from '@/components/expenses/new-expense-button';
import type { ExpenseRow, ExpenseSummary } from '@/lib/queries/expenses';
import type { ExpenseCategory } from '@/lib/validations/expense';

type Props = {
  expenses: ExpenseRow[];
  summary: ExpenseSummary;
  dateFrom: string;
  dateTo: string;
  category: ExpenseCategory | 'all';
  search: string;
};

export function DespesasView({
  expenses,
  summary,
  dateFrom,
  dateTo,
  category,
  search,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Suas saídas, sob controle
        </p>
        <div className="flex flex-wrap gap-2">
          <ExportButton from={dateFrom} to={dateTo} />
          <NewExpenseButton />
        </div>
      </div>

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
