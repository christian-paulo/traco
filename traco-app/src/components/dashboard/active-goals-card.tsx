import { ChevronRight, Target } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import type { GoalRow } from '@/lib/queries/goals';
import { GOAL_TYPE_LABELS } from '@/lib/validations/goal';

type Props = {
  goals: GoalRow[];
};

export function ActiveGoalsCard({ goals }: Props) {
  const top = goals.slice(0, 3);

  return (
    <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-3">
        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium">
          <Target className="size-4 text-[var(--gold)]" />
          Metas em andamento
        </CardTitle>
        {goals.length > 0 ? (
          <Link
            href="/dashboard/metas"
            className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--gold)] hover:underline"
          >
            Ver todas
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="px-6">
        {top.length === 0 ? (
          <Link
            href="/dashboard/metas"
            className="block rounded-md border border-dashed border-[var(--gold)]/40 bg-[var(--gold)]/5 px-4 py-6 text-center transition-colors hover:bg-[var(--gold)]/10"
          >
            <p className="font-serif text-base italic text-foreground">
              Defina sua primeira meta <span aria-hidden>🎯</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Acompanhe progresso e receba estratégias com IA.
            </p>
          </Link>
        ) : (
          <ul className="flex flex-col divide-y divide-cream-dark">
            {top.map((g) => {
              const target = g.target_value;
              const current = g.current_value;
              const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
              const valueLabel =
                g.type === 'revenue'
                  ? `${formatCurrency(current)} / ${formatCurrency(target)}`
                  : `${current} / ${target}`;
              return (
                <li key={g.id}>
                  <Link
                    href="/dashboard/metas"
                    className="-mx-2 flex flex-col gap-2 rounded-md px-2 py-3 transition-colors hover:bg-cream-dark/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {g.title}
                      </p>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-cream-dark">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--gold)] to-amber-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      <span>{GOAL_TYPE_LABELS[g.type]}</span>
                      <span>
                        {pct.toFixed(0)}% · {valueLabel}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
