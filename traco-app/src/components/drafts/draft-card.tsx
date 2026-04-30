'use client';

import { Check, Loader2, Trash2, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateTimeShort, getInitials } from '@/lib/format';
import type { BookingDraftRow } from '@/lib/queries/booking-drafts';
import { approveDraft, deleteDraft, rejectDraft } from '@/server/actions/booking-drafts';

type Props = {
  draft: BookingDraftRow;
};

export function DraftCard({ draft }: Props) {
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<'approve' | 'reject' | 'delete' | null>(null);

  function run(name: 'approve' | 'reject' | 'delete') {
    setAction(name);
    startTransition(async () => {
      let result;
      if (name === 'approve') result = await approveDraft(draft.id);
      else if (name === 'reject') result = await rejectDraft(draft.id);
      else result = await deleteDraft(draft.id);

      setAction(null);
      if (result.success) {
        toast.success(
          name === 'approve'
            ? 'Agendamento confirmado.'
            : name === 'reject'
              ? 'Solicitação recusada.'
              : 'Removido.',
        );
      } else {
        toast.error(result.error || 'Erro.');
      }
    });
  }

  return (
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
                  <span
                    style={{ color: draft.procedure.color }}
                    className="font-medium"
                  >
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
            onClick={() => run('approve')}
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
            onClick={() => run('reject')}
            disabled={pending}
          >
            {pending && action === 'reject' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <X className="size-4" />
            )}
            Recusar
          </Button>
          <Button
            variant="ghost"
            size="default"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive ml-auto h-10"
            onClick={() => run('delete')}
            disabled={pending}
          >
            {pending && action === 'delete' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
