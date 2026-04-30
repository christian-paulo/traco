'use client';

import { Check, Loader2, Trash2, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTimeShort, getInitials } from '@/lib/format';
import type { BookingDraftRow } from '@/lib/queries/booking-drafts';
import { approveDraft, deleteDraft, rejectDraft } from '@/server/actions/booking-drafts';

type Props = {
  draft: BookingDraftRow;
};

const REJECT_REASONS = [
  'Horário ocupado por outra cliente',
  'Tempo insuficiente para o procedimento',
  'Estou em folga ou viagem nesse dia',
  'Cliente já tem ficha vencida — preciso resolver antes',
  'Outro motivo',
];

export function DraftCard({ draft }: Props) {
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReasonChoice, setRejectReasonChoice] = useState<string>(REJECT_REASONS[0]);
  const [rejectCustom, setRejectCustom] = useState('');

  function handleApprove() {
    setAction('approve');
    startTransition(async () => {
      const result = await approveDraft(draft.id);
      setAction(null);
      if (result.success) {
        toast.success('Agendamento confirmado.');
      } else if ('conflict' in result && result.conflict) {
        setConflictOpen(true);
      } else {
        toast.error(result.error || 'Erro ao confirmar.');
      }
    });
  }

  function handleRejectSubmit() {
    const reason =
      rejectReasonChoice === 'Outro motivo'
        ? rejectCustom.trim()
        : `${rejectReasonChoice}${rejectCustom.trim() ? ` — ${rejectCustom.trim()}` : ''}`;
    setAction('reject');
    startTransition(async () => {
      const result = await rejectDraft(draft.id, reason || undefined);
      setAction(null);
      if (result.success) {
        toast.success('Solicitação recusada.');
        setRejectOpen(false);
      } else {
        toast.error(result.error || 'Erro ao recusar.');
      }
    });
  }

  async function handleDelete() {
    const result = await deleteDraft(draft.id);
    if (result.success) toast.success('Removido.');
    else throw new Error(result.error || 'Erro ao excluir.');
  }

  return (
    <>
      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-5">
        <CardContent className="flex flex-col gap-4 px-6">
          <div className="flex items-start gap-4">
            <Avatar className="size-12 border-2 border-cream-dark">
              <AvatarFallback className="bg-cream-dark/60 text-muted-foreground text-sm font-medium">
                {getInitials(draft.client_full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-serif text-lg font-medium text-foreground">
                  {draft.client_full_name}
                </p>
                <Badge
                  variant="outline"
                  className="border-amber-500/40 bg-amber-500/10 text-amber-700"
                >
                  Aguardando confirmação
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                📱 {draft.client_phone}
                {draft.client_email ? <span> · ✉ {draft.client_email}</span> : null}
              </p>
              <p className="text-sm text-foreground">
                <span className="font-medium">{formatDateTimeShort(draft.scheduled_start_at)}</span>
                {draft.procedure ? (
                  <>
                    {' '}·{' '}
                    <span style={{ color: draft.procedure.color }} className="font-medium">
                      {draft.procedure.name}
                    </span>
                  </>
                ) : null}
              </p>
              {draft.client_notes ? (
                <p className="font-serif text-sm italic text-muted-foreground">
                  &ldquo;{draft.client_notes}&rdquo;
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              size="default"
              className="h-10 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApprove}
              disabled={pending}
            >
              {pending && action === 'approve' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Confirmar
            </Button>
            <Button
              variant="ghost"
              size="default"
              className="h-10"
              onClick={() => setRejectOpen(true)}
              disabled={pending}
            >
              <X className="size-4" />
              Recusar
            </Button>
            <Button
              variant="ghost"
              size="default"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive ml-auto h-10"
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
            >
              <Trash2 className="size-4" />
              Excluir
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir solicitação?"
        description={`A solicitação de ${draft.client_full_name} será removida permanentemente. Considere recusar com motivo em vez de excluir, pra que a cliente receba retorno.`}
        confirmLabel="Excluir"
        icon={Trash2}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={conflictOpen}
        onOpenChange={setConflictOpen}
        title="Esse horário foi ocupado"
        description="Entre a solicitação e agora, esse horário foi ocupado por outro atendimento. Recuse a solicitação com motivo e entre em contato com a cliente sugerindo outra data."
        confirmLabel="Ok, vou avisar a cliente"
        cancelLabel="Fechar"
        variant="premium"
        onConfirm={() => {
          setConflictOpen(false);
        }}
      />

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recusar agendamento</DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {draft.client_full_name} será notificada por email. Escolha um motivo para
              que ela entenda e possa tentar outra data.
            </p>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">Motivo</Label>
                <Select
                  value={rejectReasonChoice}
                  onValueChange={(v) => setRejectReasonChoice(v ?? REJECT_REASONS[0])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REJECT_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">
                  Mensagem adicional (opcional)
                </Label>
                <Textarea
                  rows={3}
                  value={rejectCustom}
                  onChange={(e) => setRejectCustom(e.target.value)}
                  placeholder="Sugiro tentar terça da próxima semana às 14h…"
                  maxLength={500}
                  disabled={pending}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRejectOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Recusar e notificar cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
