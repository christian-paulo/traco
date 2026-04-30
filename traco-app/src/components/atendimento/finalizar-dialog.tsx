'use client';

import { Check, Loader2, Timer, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { finalizeAppointment } from '@/server/actions/appointments';

type Status = 'completed' | 'cancelled' | 'no_show';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  clientName: string;
  procedureName: string;
  elapsedSeconds: number;
  defaultPrice: number;
  defaultReturnDate: string | null;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${pad(m)}min` : `${pad(m)}min`;
}

function isoToInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function inputToIso(value: string): string | null {
  if (!value) return null;
  return value;
}

export function FinalizarDialog({
  open,
  onOpenChange,
  appointmentId,
  clientName,
  procedureName,
  elapsedSeconds,
  defaultPrice,
  defaultReturnDate,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('completed');
  const [price, setPrice] = useState<string>(defaultPrice.toFixed(2));
  const [returnDate, setReturnDate] = useState<string>(isoToInput(defaultReturnDate));
  const [note, setNote] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setStatus('completed');
      setPrice(defaultPrice.toFixed(2));
      setReturnDate(isoToInput(defaultReturnDate));
      setNote('');
    }
  }, [open, defaultPrice, defaultReturnDate]);

  function handleSubmit() {
    const parsedPrice = Number(price.replace(',', '.'));
    if (status === 'completed' && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      toast.error('Valor inválido.');
      return;
    }

    startTransition(async () => {
      const result = await finalizeAppointment(appointmentId, {
        status,
        final_price: status === 'completed' ? parsedPrice : undefined,
        return_due_date: status === 'completed' ? inputToIso(returnDate) : null,
        final_note: note.trim() || undefined,
      });
      if (result.success) {
        toast.success('Atendimento finalizado.');
        onOpenChange(false);
        router.push('/dashboard/agenda');
      } else {
        toast.error(result.error || 'Erro ao finalizar.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Finalizar atendimento</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border border-cream-dark bg-cream/40 px-4 py-3">
              <p className="font-serif text-base font-medium text-foreground">{clientName}</p>
              <p className="text-xs text-muted-foreground">{procedureName}</p>
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-foreground/70">
                <Timer className="size-3" />
                Duração registrada: {formatDuration(elapsedSeconds)}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-[0.14em]">Resultado</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <StatusOption
                  active={status === 'completed'}
                  onClick={() => setStatus('completed')}
                  icon={<Check className="size-4" />}
                  label="Concluído"
                  tone="success"
                />
                <StatusOption
                  active={status === 'no_show'}
                  onClick={() => setStatus('no_show')}
                  icon={<Timer className="size-4" />}
                  label="Não compareceu"
                  tone="warning"
                />
                <StatusOption
                  active={status === 'cancelled'}
                  onClick={() => setStatus('cancelled')}
                  icon={<XCircle className="size-4" />}
                  label="Cancelado"
                  tone="danger"
                />
              </div>
            </div>

            {status === 'completed' ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs uppercase tracking-[0.14em]">
                      Valor cobrado (R$)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={pending}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Sugestão: {formatCurrency(defaultPrice)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs uppercase tracking-[0.14em]">
                      Retorno previsto
                    </Label>
                    <Input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      disabled={pending}
                    />
                  </div>
                </div>
              </>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-[0.14em]">
                Observação final (opcional)
              </Label>
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Adicione uma nota interna sobre este atendimento…"
                maxLength={2000}
                disabled={pending}
              />
              <p className="text-[10px] text-muted-foreground">
                Será salva como nota fixa no perfil da cliente.
              </p>
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Voltar
          </Button>
          <Button variant="premium" onClick={handleSubmit} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Finalizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusOption({
  active,
  onClick,
  icon,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: 'success' | 'warning' | 'danger';
}) {
  const toneCls =
    tone === 'success'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
      : tone === 'warning'
        ? 'border-amber-300 bg-amber-50 text-amber-800'
        : 'border-red-300 bg-red-50 text-red-800';
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md border-2 px-3 py-2.5 text-xs font-medium uppercase tracking-[0.12em] transition-all',
        active
          ? toneCls + ' shadow-sm'
          : 'border-cream-dark bg-card text-foreground/60 hover:border-[var(--gold)]/40 hover:text-foreground',
      )}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  );
}
