'use client';

import { AlertTriangle, CheckCircle2, Eye, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
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
import { formatDate } from '@/lib/format';
import type { ReactionRow, ReactionStatus, ReactionType } from '@/lib/queries/reactions';
import {
  occurredWhenLabel,
  reactionStatusLabel,
  reactionTypeLabel,
} from '@/lib/reactions/labels';
import { cn } from '@/lib/utils';
import { deleteReaction, updateReactionStatus } from '@/server/actions/reactions';

import { ReactionFormDialog } from './reaction-form-dialog';

type Props = {
  clientId: string;
  appointmentId: string | null;
  reactions: ReactionRow[];
};

const TYPE_CLS: Record<ReactionType, string> = {
  allergy: 'border-red-300 bg-red-50 text-red-800',
  irritation: 'border-orange-300 bg-orange-50 text-orange-800',
  hypersensitivity: 'border-amber-300 bg-amber-50 text-amber-800',
  positive_excellent: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  below_expected: 'border-slate-300 bg-slate-50 text-slate-700',
  other: 'border-muted bg-muted text-muted-foreground',
};

const STATUS_CLS: Record<ReactionStatus, string> = {
  active: 'border-red-400 bg-red-100 text-red-800',
  observation: 'border-amber-400 bg-amber-100 text-amber-800',
  resolved: 'border-emerald-400 bg-emerald-100 text-emerald-800',
};

export function TabReacoes({ clientId, appointmentId, reactions }: Props) {
  const [openForm, setOpenForm] = useState(false);

  if (reactions.length === 0) {
    return (
      <>
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-8 text-emerald-600" strokeWidth={1.25} />
            </div>
            <p className="font-serif text-lg italic text-muted-foreground">
              Nenhuma reação registrada — sinal de bom trabalho{' '}
              <span aria-hidden>🤍</span>
            </p>
            <Button variant="premium" size="xl" onClick={() => setOpenForm(true)}>
              <Plus className="size-4" />
              Registrar reação
            </Button>
          </CardContent>
        </Card>
        <ReactionFormDialog
          open={openForm}
          onOpenChange={setOpenForm}
          clientId={clientId}
          appointmentId={appointmentId}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {reactions.length} {reactions.length === 1 ? 'registro' : 'registros'}
        </p>
        <Button variant="outline-gold" size="sm" onClick={() => setOpenForm(true)}>
          <Plus className="size-4" />
          Nova reação
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {reactions.map((r) => (
          <ReactionCard key={r.id} reaction={r} />
        ))}
      </div>

      <ReactionFormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        clientId={clientId}
        appointmentId={appointmentId}
      />
    </div>
  );
}

function ReactionCard({ reaction }: { reaction: ReactionRow }) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmResolve, setConfirmResolve] = useState(false);
  const typeCls = TYPE_CLS[reaction.reaction_type] ?? '';
  const statusCls = STATUS_CLS[reaction.status] ?? '';

  function changeStatus(next: ReactionStatus) {
    startTransition(async () => {
      const result = await updateReactionStatus(reaction.id, next);
      if (result.success) toast.success('Status atualizado.');
      else toast.error(result.error || 'Erro ao atualizar.');
    });
  }

  async function doDelete() {
    const result = await deleteReaction(reaction.id);
    if (result.success) toast.success('Reação excluída.');
    else throw new Error(result.error || 'Erro ao excluir.');
  }

  async function doResolve() {
    const result = await updateReactionStatus(reaction.id, 'resolved');
    if (result.success) toast.success('Reação marcada como resolvida.');
    else throw new Error(result.error || 'Erro ao atualizar.');
  }

  return (
    <Card
      variant="premium"
      className={cn(
        'bg-card border-0 ring-1',
        reaction.status === 'active' ? 'ring-red-300' : 'ring-[var(--border)]',
      )}
    >
      <CardContent className="flex flex-col gap-3 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={typeCls}>
                {reaction.reaction_type === 'allergy' ||
                reaction.reaction_type === 'irritation' ? (
                  <AlertTriangle className="size-3" />
                ) : null}
                {reactionTypeLabel(reaction.reaction_type)}
              </Badge>
              <Badge variant="outline" className={statusCls}>
                {reactionStatusLabel(reaction.status)}
              </Badge>
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {occurredWhenLabel(reaction.occurred_when)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Registrada em {formatDate(reaction.recorded_at, 'short')}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-8" aria-label="Ações">
                  <MoreVertical className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              {reaction.status !== 'active' ? (
                <DropdownMenuItem onClick={() => changeStatus('active')} disabled={pending}>
                  <AlertTriangle className="size-4" />
                  Marcar como ativa
                </DropdownMenuItem>
              ) : null}
              {reaction.status !== 'observation' ? (
                <DropdownMenuItem
                  onClick={() => changeStatus('observation')}
                  disabled={pending}
                >
                  <Eye className="size-4" />
                  Em observação
                </DropdownMenuItem>
              ) : null}
              {reaction.status !== 'resolved' ? (
                <DropdownMenuItem
                  onClick={() => setConfirmResolve(true)}
                  disabled={pending}
                >
                  <CheckCircle2 className="size-4" />
                  Marcar como resolvida
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={pending}
              >
                <Trash2 className="size-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Sintomas
            </p>
            <p className="text-foreground">{reaction.symptoms}</p>
          </div>
          {reaction.treatment ? (
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Tratamento aplicado
              </p>
              <p className="text-foreground">{reaction.treatment}</p>
            </div>
          ) : null}
          {reaction.notes ? (
            <div>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Observações
              </p>
              <p className="text-foreground">{reaction.notes}</p>
            </div>
          ) : null}
        </div>

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Excluir reação?"
          description="Este registro será removido permanentemente. Considere marcar como resolvida em vez de excluir, pra manter o histórico clínico."
          confirmLabel="Excluir mesmo assim"
          icon={Trash2}
          onConfirm={doDelete}
        />
        <ConfirmDialog
          open={confirmResolve}
          onOpenChange={setConfirmResolve}
          title="Marcar como resolvida?"
          description="Esta reação não aparecerá mais nos alertas de atendimento. Você pode reverter o status depois."
          confirmLabel="Sim, marcar resolvida"
          variant="premium"
          icon={CheckCircle2}
          onConfirm={doResolve}
        />
      </CardContent>
    </Card>
  );
}
