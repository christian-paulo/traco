import { Receipt, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import type { RecurringExpenseCreatedToday } from '@/lib/queries/expenses';
import {
  EXPENSE_CATEGORY_COLORS,
  EXPENSE_CATEGORY_LABELS,
} from '@/lib/validations/expense';

const HIGHLIGHT_THRESHOLD = 500;

type Props = {
  expenses: RecurringExpenseCreatedToday[];
};

export function RecurringExpensesCard({ expenses }: Props) {
  if (expenses.length === 0) return null;

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const isHighlight = total >= HIGHLIGHT_THRESHOLD;

  return (
    <Link href="/dashboard/despesas" className="block">
      <Card
        variant="premium"
        className={
          isHighlight
            ? 'border-0 bg-gradient-to-br from-amber-50 to-cream/40 ring-1 ring-amber-300 transition-all hover:shadow-lg'
            : 'bg-card border-0 ring-1 ring-[var(--border)] transition-all hover:shadow-md'
        }
      >
        <CardContent className="flex items-center gap-4 px-6 py-5">
          <div
            className={
              isHighlight
                ? 'flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-100'
                : 'flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/10'
            }
          >
            <RefreshCw
              className={
                isHighlight
                  ? 'size-5 text-amber-700'
                  : 'size-5 text-[var(--gold)]'
              }
              strokeWidth={1.5}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <p className="font-serif text-base font-medium text-foreground">
              {expenses.length}{' '}
              {expenses.length === 1 ? 'despesa recorrente lançada' : 'despesas recorrentes lançadas'}{' '}
              hoje
            </p>
            <p className="text-xs text-muted-foreground">
              Total:{' '}
              <span
                className={
                  isHighlight
                    ? 'font-medium text-amber-800'
                    : 'font-medium text-foreground'
                }
              >
                {formatCurrency(total)}
              </span>
            </p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {expenses.slice(0, 4).map((e) => {
                const color = EXPENSE_CATEGORY_COLORS[e.category] ?? '#6B7280';
                return (
                  <li
                    key={e.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-0.5 text-[10px] ring-1 ring-cream-dark"
                  >
                    <span
                      aria-hidden
                      className="inline-block size-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-foreground/80">
                      {EXPENSE_CATEGORY_LABELS[e.category]} ·{' '}
                      {formatCurrency(e.amount)}
                    </span>
                  </li>
                );
              })}
              {expenses.length > 4 ? (
                <li className="text-[10px] text-muted-foreground">
                  +{expenses.length - 4}
                </li>
              ) : null}
            </ul>
          </div>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:inline">
            <Receipt className="size-3.5" /> Ver
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
