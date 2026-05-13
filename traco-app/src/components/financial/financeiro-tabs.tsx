'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ExpenseRow, ExpenseSummary } from '@/lib/queries/expenses';
import type {
  RevenueOverview,
  TopClient,
} from '@/lib/queries/financial';
import type { AchievementRow, GoalRow } from '@/lib/queries/goals';
import type { ExpenseCategory } from '@/lib/validations/expense';

import { DespesasView } from './views/despesas-view';
import { MetasView } from './views/metas-view';
import { ReceitaView } from './views/receita-view';

type Tab = 'receita' | 'despesas' | 'metas';

type Props = {
  initialTab: Tab;
  // Receita
  dateFrom: string;
  dateTo: string;
  overview: RevenueOverview;
  comparison: { current: number; previous: number; deltaPct: number | null };
  monthly: Array<{ month: string; label: string; revenue: number; appointments: number }>;
  comparisonChart: Array<{ label: string; revenue: number; expenses: number; profit: number }>;
  expenseSummary: ExpenseSummary;
  topClients: TopClient[];
  byDay: Array<{ dayOfWeek: number; label: string; revenue: number; appointments: number }>;
  // Despesas
  expenses: ExpenseRow[];
  expenseCategory: ExpenseCategory | 'all';
  expenseSearch: string;
  // Metas
  goals: GoalRow[];
  achievements: AchievementRow[];
};

export function FinanceiroTabs(props: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function handleTabChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <Tabs value={props.initialTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="receita">Receita</TabsTrigger>
        <TabsTrigger value="despesas">Despesas</TabsTrigger>
        <TabsTrigger value="metas">Metas</TabsTrigger>
      </TabsList>

      <TabsContent value="receita" className="mt-6">
        <ReceitaView
          dateFrom={props.dateFrom}
          dateTo={props.dateTo}
          overview={props.overview}
          comparison={props.comparison}
          monthly={props.monthly}
          comparisonChart={props.comparisonChart}
          expenseSummary={props.expenseSummary}
          topClients={props.topClients}
          byDay={props.byDay}
        />
      </TabsContent>

      <TabsContent value="despesas" className="mt-6">
        <DespesasView
          expenses={props.expenses}
          summary={props.expenseSummary}
          dateFrom={props.dateFrom}
          dateTo={props.dateTo}
          category={props.expenseCategory}
          search={props.expenseSearch}
        />
      </TabsContent>

      <TabsContent value="metas" className="mt-6">
        <MetasView goals={props.goals} achievements={props.achievements} />
      </TabsContent>
    </Tabs>
  );
}
