'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  ClientCombobox,
  type ClientLite,
} from '@/components/appointments/client-combobox';
import { ProcedureSelect } from '@/components/appointments/procedure-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ProcedureRow } from '@/lib/queries/procedures';
import { createScheduledAppointment } from '@/server/actions/appointments';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientLite[];
  procedures: ProcedureRow[];
  defaultStartLocal: string; // formato "YYYY-MM-DDTHH:mm"
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function addMinutesToLocal(localIso: string, minutes: number): string {
  const m = localIso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return localIso;
  const d = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
  );
  d.setMinutes(d.getMinutes() + minutes);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function diffMinutes(startLocal: string, endLocal: string): number {
  const sm = startLocal.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  const em = endLocal.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!sm || !em) return 0;
  const s = new Date(
    Number(sm[1]),
    Number(sm[2]) - 1,
    Number(sm[3]),
    Number(sm[4]),
    Number(sm[5]),
  ).getTime();
  const e = new Date(
    Number(em[1]),
    Number(em[2]) - 1,
    Number(em[3]),
    Number(em[4]),
    Number(em[5]),
  ).getTime();
  return Math.max(0, Math.round((e - s) / 60_000));
}

export function ScheduleAppointmentDialog({
  open,
  onOpenChange,
  clients,
  procedures,
  defaultStartLocal,
}: Props) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [procedure, setProcedure] = useState<ProcedureRow | null>(null);
  const [startLocal, setStartLocal] = useState(defaultStartLocal);
  const [endLocal, setEndLocal] = useState(addMinutesToLocal(defaultStartLocal, 60));
  const [price, setPrice] = useState('0');
  const [notes, setNotes] = useState('');
  const [pending, startTransition] = useTransition();

  // Reset on (re)open
  useEffect(() => {
    if (!open) return;
    setClientId(null);
    setProcedure(null);
    setStartLocal(defaultStartLocal);
    setEndLocal(addMinutesToLocal(defaultStartLocal, 60));
    setPrice('0');
    setNotes('');
  }, [open, defaultStartLocal]);

  // Quando muda procedimento, ajusta end e price
  function handleProcedureChange(proc: ProcedureRow) {
    setProcedure(proc);
    setPrice(String(Number(proc.default_price ?? 0)));
    // Mantém duração existente do form se já foi customizada; senão usa 60min default
    const currentMins = diffMinutes(startLocal, endLocal);
    const dur = currentMins > 0 ? currentMins : 60;
    setEndLocal(addMinutesToLocal(startLocal, dur));
  }

  // Quando muda start, ajusta end pra preservar duração
  function handleStartChange(next: string) {
    const dur = Math.max(15, diffMinutes(startLocal, endLocal) || 60);
    setStartLocal(next);
    setEndLocal(addMinutesToLocal(next, dur));
  }

  const isValid = useMemo(() => {
    if (!clientId || !procedure) return false;
    if (!startLocal || !endLocal) return false;
    if (diffMinutes(startLocal, endLocal) < 15) return false;
    const parsedPrice = Number(price.replace(',', '.'));
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return false;
    return true;
  }, [clientId, procedure, startLocal, endLocal, price]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !clientId || !procedure) return;
    startTransition(async () => {
      const result = await createScheduledAppointment({
        client_id: clientId,
        procedure_id: procedure.id,
        scheduled_start_at: startLocal,
        scheduled_end_at: endLocal,
        price: Number(price.replace(',', '.')),
        notes: notes.trim() || null,
        notes_internal: null,
      });
      if (result.success) {
        toast.success('Agendamento criado.');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Erro ao agendar.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>
            Cliente, procedimento e horário. A cliente recebe a confirmação só quando você
            decidir avisar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Cliente
                </Label>
                <ClientCombobox
                  clients={clients}
                  value={clientId}
                  onChange={setClientId}
                  disabled={pending}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Procedimento
                </Label>
                <ProcedureSelect
                  procedures={procedures}
                  value={procedure?.id ?? null}
                  onChange={handleProcedureChange}
                  disabled={pending}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Início
                  </Label>
                  <Input
                    type="datetime-local"
                    value={startLocal}
                    onChange={(e) => handleStartChange(e.target.value)}
                    disabled={pending}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Fim
                  </Label>
                  <Input
                    type="datetime-local"
                    value={endLocal}
                    onChange={(e) => setEndLocal(e.target.value)}
                    disabled={pending}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Valor (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={pending}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Observações (opcional)
                </Label>
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalhes pra esse atendimento…"
                  maxLength={500}
                  disabled={pending}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button variant="premium" type="submit" disabled={!isValid || pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Agendar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
