'use client';

import {
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/format';
import type { GoalRow } from '@/lib/queries/goals';
import {
  GOAL_PERIOD_LABELS,
  GOAL_TYPE_LABELS,
} from '@/lib/validations/goal';
import { cn } from '@/lib/utils';
import { cancelGoal, deleteGoal } from '@/server/actions/goals';

import { GoalFormDialog, type EditableGoal } from './goal-form-dialog';
import { GoalStrategyDialog } from './goal-strategy-dialog';

type Props = {
  goal: GoalRow;
};

function daysBetween(fromIso: string, toIso: string): number {
  const f = new Date(`${fromIso}T00:00:00`);
  const t = new Date(`${toIso}T23:59:59`);
  return Math.max(1, Math.ceil((t.getTime() - f.getTime()) / (1000 * 60 * 60 * 24)));
}

function emotionalState(progressPct: number, timePct: number) {
  if (progressPct >= timePct + 10) {
    return { label: '🚀 Você tá adiantada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (progressPct >= timePct - 10) {
    return { label: '🎯 No caminho certo', cls: 'bg-[var(--gold)]/10 text-foreground border-[var(--gold)]/40' };
  }
  return { label: '⚡ Precisa acelerar', cls: 'bg-amber-50 text-amber-800 border-amber-300' };
}

export function GoalCard({ goal }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [, startTransition] = useTransition();

  const target = goal.target_value;
  const current = goal.current_value;
  const progressPct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

  const totalDays = daysBetween(goal.start_date, goal.end_date);
  const today = new Date();
  const startDate = new Date(`${goal.start_date}T00:00:00`);
  const endDate = new Date(`${goal.end_date}T23:59:59`);
  const elapsedMs = Math.min(
    today.getTime() - startDate.getTime(),
    endDate.getTime() - startDate.getTime(),
  );
  const elapsedDays = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
  const timePct = totalDays > 0 ? Math.min(100, (elapsedDays / totalDays) * 100) : 0;
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const emotion = useMemo(
    () => emotionalState(progressPct, timePct),
    [progressPct, timePct],
  );

  const isAchieved = goal.status === 'achieved' || progressPct >= 100;
  const isCancelled = goal.status === 'cancelled';
  const isFailed = goal.status === 'failed';

  const valueLabel =
    goal.type === 'revenue'
      ? `${formatCurrency(current)} de ${formatCurrency(target)}`
      : `${current} de ${target}`;

  async function handleDeleteConfirm() {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        const r = await deleteGoal(goal.id);
        if (r.success) {
          toast.success('Meta excluída.');
          resolve();
        } else {
          reject(new Error(r.error));
        }
      });
    });
  }

  async function handleCancelConfirm() {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        const r = await cancelGoal(goal.id);
        if (r.success) {
          toast.success('Meta cancelada.');
          resolve();
        } else {
          reject(new Error(r.error));
        }
      });
    });
  }

  const editable: EditableGoal = {
    id: goal.id,
    type: goal.type,
    target_value: goal.target_value,
    period_type: goal.period_type,
    start_date: goal.start_date,
    end_date: goal.end_date,
    title: goal.title,
    description: goal.description,
  };

  return (
    <>
      <Card
        variant="premium"
        className={cn(
          'bg-card border-0 ring-1',
          isAchieved
            ? 'ring-emerald-300'
            : isCancelled || isFailed
              ? 'ring-muted opacity-70'
              : 'ring-[var(--gold)]/30',
        )}
      >
        <CardContent className="flex flex-col gap-4 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-cream-dark text-[10px] uppercase tracking-[0.14em]"
                >
                  {GOAL_TYPE_LABELS[goal.type]} · {GOAL_PERIOD_LABELS[goal.period_type]}
                </Badge>
                {isAchieved ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-300 bg-emerald-50 text-[10px] uppercase tracking-[0.14em] text-emerald-800"
                  >
                    <CheckCircle2 className="size-3" /> Atingida
                  </Badge>
                ) : null}
                {isCancelled ? (
                  <Badge
                    variant="outline"
                    className="border-muted text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                  >
                    Cancelada
                  </Badge>
                ) : null}
                {isFailed ? (
                  <Badge
                    variant="outline"
                    className="border-red-300 bg-red-50 text-[10px] uppercase tracking-[0.14em] text-red-700"
                  >
                    Não atingida
                  </Badge>
                ) : null}
              </div>
              <h3 className="font-serif text-2xl font-medium text-foreground">{goal.title}</h3>
              <p className="text-xs text-muted-foreground">
                {formatDate(goal.start_date, 'short')} – {formatDate(goal.end_date, 'short')}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Ações">
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="size-4" /> Editar
                </DropdownMenuItem>
                {!isCancelled && !isAchieved ? (
                  <DropdownMenuItem onClick={() => setConfirmCancel(true)}>
                    <XCircle className="size-4" /> Cancelar meta
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-serif text-xl font-medium text-foreground">{valueLabel}</span>
              <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {progressPct.toFixed(0)}% completo
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-cream-dark">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--gold)] to-amber-500 transition-all duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
              {timePct > 0 && timePct < 100 ? (
                <div
                  className="absolute inset-y-0 w-[2px] bg-foreground/30"
                  style={{ left: `calc(${timePct}% - 1px)` }}
                  title={`${timePct.toFixed(0)}% do tempo decorrido`}
                  aria-hidden
                />
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-2">
              <Badge
                variant="outline"
                className={cn('text-[10px] uppercase tracking-[0.14em]', emotion.cls)}
              >
                {emotion.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {daysRemaining > 0
                  ? `${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} restantes`
                  : 'Período encerrado'}
              </span>
            </div>
          </div>

          {goal.description ? (
            <p className="font-serif text-sm italic text-muted-foreground">
              {goal.description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 border-t border-cream-dark pt-3">
            <Button
              variant="outline-gold"
              size="sm"
              onClick={() => setStrategyOpen(true)}
            >
              <Sparkles className="size-4" />
              Ver estratégia com IA
            </Button>
          </div>
        </CardContent>
      </Card>

      <GoalFormDialog open={editOpen} onOpenChange={setEditOpen} goal={editable} />

      <GoalStrategyDialog
        open={strategyOpen}
        onOpenChange={setStrategyOpen}
        goalId={goal.id}
        goalTitle={goal.title}
        initialStrategy={goal.ai_strategy_text}
        initialGeneratedAt={goal.ai_strategy_generated_at}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir meta?"
        description={`A meta "${goal.title}" será removida permanentemente. As conquistas geradas a partir dela permanecem.`}
        confirmLabel="Excluir"
        icon={Trash2}
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancelar meta?"
        description="A meta fica como cancelada e não aparece mais nos cards ativos. Você pode excluir ou criar uma nova."
        confirmLabel="Sim, cancelar"
        cancelLabel="Voltar"
        variant="premium"
        icon={XCircle}
        onConfirm={handleCancelConfirm}
      />
    </>
  );
}
