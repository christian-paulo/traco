import { Target } from 'lucide-react';
import type { Metadata } from 'next';

import { AchievementsGrid } from '@/components/goals/achievements-grid';
import { GoalCard } from '@/components/goals/goal-card';
import { NewGoalButton } from '@/components/goals/new-goal-button';
import { Card, CardContent } from '@/components/ui/card';
import {
  listAchievements,
  listAllGoals,
  markAllAchievementsSeenInline,
} from '@/lib/queries/goals';
import { refreshAllGoalsProgress } from '@/server/actions/goals';

export const metadata: Metadata = {
  title: 'Metas',
};

export default async function MetasPage() {
  // Garante que current_value está atualizado pra cada visita
  await refreshAllGoalsProgress();
  // Marca conquistas como vistas — se chegou aqui, designer já viu.
  // Versão inline (sem revalidatePath) pra não conflitar com render do page.
  await markAllAchievementsSeenInline();

  const [goals, achievements] = await Promise.all([
    listAllGoals(),
    listAchievements(),
  ]);

  const activeGoals = goals.filter((g) => g.status === 'active');
  const finishedGoals = goals.filter((g) => g.status !== 'active');

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-px w-8 bg-[var(--gold)]" />
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            Metas
          </h1>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Onde você quer chegar
          </p>
        </div>
        <NewGoalButton />
      </header>

      {activeGoals.length === 0 ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-[var(--gold)]/10">
              <Target className="size-8 text-[var(--gold)]" strokeWidth={1.25} />
            </div>
            <p className="font-serif text-lg italic text-foreground">
              Defina sua primeira meta <span aria-hidden>🎯</span>
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Acompanhe progresso em tempo real e receba estratégias com IA pra atingir.
            </p>
            <NewGoalButton />
          </CardContent>
        </Card>
      ) : (
        <section className="flex flex-col gap-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Ativas
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {activeGoals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        </section>
      )}

      {finishedGoals.length > 0 ? (
        <section className="flex flex-col gap-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Histórico
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {finishedGoals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        </section>
      ) : null}

      <section id="conquistas" className="flex flex-col gap-4 scroll-mt-6">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Conquistas
          </p>
          <p className="font-serif text-base italic text-muted-foreground">
            Marcos da sua jornada — desbloqueie todos.
          </p>
        </div>
        <AchievementsGrid achievements={achievements} />
      </section>
    </div>
  );
}
