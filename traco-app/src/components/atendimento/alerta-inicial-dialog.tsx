'use client';

import { AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CriticalAlert } from '@/lib/anamnesis/critical-answers';
import { formatDate } from '@/lib/format';
import type { ReactionRow } from '@/lib/queries/reactions';
import { reactionTypeLabel } from '@/lib/reactions/labels';
import { cn } from '@/lib/utils';
import { updateReactionStatus } from '@/server/actions/reactions';

type Props = {
  appointmentId: string;
  clientName: string;
  reactions: ReactionRow[];
  criticalAlerts: CriticalAlert[];
};

function ackKey(appointmentId: string) {
  return `traco_alert_ack_${appointmentId}`;
}

export function AlertaInicialDialog({
  appointmentId,
  clientName,
  reactions,
  criticalAlerts,
}: Props) {
  const router = useRouter();
  const activeReactions = reactions.filter((r) => r.status === 'active');
  const hasReactions = activeReactions.length > 0;
  const hasFichaAlerts = criticalAlerts.length > 0;
  const shouldShow = hasReactions || hasFichaAlerts;

  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!shouldShow) return;
    if (typeof window === 'undefined') return;
    const acknowledged = window.localStorage.getItem(ackKey(appointmentId));
    if (!acknowledged) {
      setOpen(true);
    }
  }, [appointmentId, shouldShow]);

  function handleStart() {
    if (hasReactions && !confirmed) {
      toast.error('Confirme a revisão das reações antes de iniciar.');
      return;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ackKey(appointmentId), new Date().toISOString());
    }
    setOpen(false);
  }

  function handleCancel() {
    setOpen(false);
    router.push('/dashboard/agenda');
  }

  function handleResolve(reactionId: string) {
    startTransition(async () => {
      const result = await updateReactionStatus(reactionId, 'resolved');
      if (result.success) {
        toast.success('Reação marcada como resolvida.');
        router.refresh();
      } else {
        toast.error(result.error || 'Erro ao atualizar.');
      }
    });
  }

  if (!shouldShow) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Bloqueia fechamento via overlay/Esc se há reações ativas e ainda não confirmou
        if (!next && hasReactions && !confirmed) {
          toast.error('Revise e confirme antes de iniciar o atendimento.');
          return;
        }
        setOpen(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden border-red-200 bg-red-50 p-0 sm:max-w-2xl"
      >
        <div className="bg-red-600 px-6 py-5 text-white">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-7 shrink-0" strokeWidth={2} />
            <div className="flex flex-col gap-1">
              <DialogHeader className="border-0 p-0">
                <DialogTitle className="text-white">
                  {hasReactions
                    ? 'ATENÇÃO — Reações ativas registradas'
                    : 'Avisos clínicos importantes'}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-white/85">
                Antes de iniciar o atendimento de <strong>{clientName}</strong>, revise:
              </p>
            </div>
          </div>
        </div>

        <DialogBody className="bg-red-50/30">
          <div className="flex flex-col gap-4">
            {hasReactions ? (
              <section className="flex flex-col gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-red-700">
                  Reações ativas ({activeReactions.length})
                </p>
                {activeReactions.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col gap-2 rounded-md border border-red-300 bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-red-300 bg-red-50 text-red-800"
                        >
                          {reactionTypeLabel(r.reaction_type)}
                        </Badge>
                        <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          Registrada em {formatDate(r.recorded_at, 'short')}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleResolve(r.id)}
                        disabled={pending}
                      >
                        <CheckCircle2 className="size-3.5" />
                        Marcar como resolvida
                      </Button>
                    </div>
                    <div className="flex flex-col gap-1.5 text-sm">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          Sintomas
                        </p>
                        <p className="text-foreground">{r.symptoms}</p>
                      </div>
                      {r.treatment ? (
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                            Tratamento aplicado
                          </p>
                          <p className="text-foreground">{r.treatment}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </section>
            ) : null}

            {hasFichaAlerts ? (
              <section className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-amber-700" />
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-800">
                    Avisos da ficha
                  </p>
                </div>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {criticalAlerts.map((a, idx) => (
                    <li
                      key={idx}
                      className={cn(
                        'flex items-start gap-2 leading-snug',
                        a.level === 'high' ? 'text-amber-900' : 'text-amber-800/85',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-1 inline-block size-1.5 shrink-0 rounded-full',
                          a.level === 'high' ? 'bg-red-500' : 'bg-amber-500',
                        )}
                        aria-hidden
                      />
                      {a.text}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] uppercase tracking-[0.14em] text-amber-700/70">
                  Apenas informativo — considere o protocolo apropriado.
                </p>
              </section>
            ) : null}

            {hasReactions ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-red-300 bg-white px-4 py-3 transition-colors hover:bg-red-50/50">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 size-4 cursor-pointer accent-red-600"
                />
                <span className="text-sm text-foreground">
                  Confirmo que revisei as reações ativas e considerei o protocolo
                  apropriado para o atendimento de hoje.
                </span>
              </label>
            ) : null}
          </div>
        </DialogBody>

        <DialogFooter className="bg-cream/40">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={pending}
            className="text-muted-foreground"
          >
            <X className="size-4" />
            Cancelar e voltar
          </Button>
          <Button
            variant="premium"
            onClick={handleStart}
            disabled={pending || (hasReactions && !confirmed)}
          >
            Iniciar atendimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
