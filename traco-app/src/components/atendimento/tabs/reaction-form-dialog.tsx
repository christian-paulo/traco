'use client';

import { Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ReactionStatus, ReactionType, ReactionWhen } from '@/lib/queries/reactions';
import {
  OCCURRED_WHEN_LABELS,
  REACTION_STATUS_LABELS,
  REACTION_TYPE_LABELS,
} from '@/lib/reactions/labels';
import { createReaction } from '@/server/actions/reactions';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  appointmentId: string | null;
};

const TYPES: Array<{ value: ReactionType; label: string }> = (
  ['allergy', 'irritation', 'hypersensitivity', 'positive_excellent', 'below_expected', 'other'] as const
).map((v) => ({ value: v, label: REACTION_TYPE_LABELS[v] }));

const WHENS: Array<{ value: ReactionWhen; label: string }> = (
  ['during', 'immediately_after', '24_72h_after', 'late_1week_plus'] as const
).map((v) => ({ value: v, label: OCCURRED_WHEN_LABELS[v] }));

const STATUSES: Array<{ value: ReactionStatus; label: string }> = (
  ['observation', 'active', 'resolved'] as const
).map((v) => ({ value: v, label: REACTION_STATUS_LABELS[v] }));

export function ReactionFormDialog({ open, onOpenChange, clientId, appointmentId }: Props) {
  const [type, setType] = useState<ReactionType>('irritation');
  const [when, setWhen] = useState<ReactionWhen>('during');
  const [status, setStatus] = useState<ReactionStatus>('observation');
  const [symptoms, setSymptoms] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [pending, startTransition] = useTransition();

  function reset() {
    setType('irritation');
    setWhen('during');
    setStatus('observation');
    setSymptoms('');
    setTreatment('');
    setNotes('');
  }

  function handleSubmit() {
    if (!symptoms.trim() || symptoms.trim().length < 3) {
      toast.error('Descreva os sintomas (mínimo 3 caracteres).');
      return;
    }
    startTransition(async () => {
      const result = await createReaction({
        client_id: clientId,
        appointment_id: appointmentId,
        reaction_type: type,
        occurred_when: when,
        status,
        symptoms: symptoms.trim(),
        treatment: treatment.trim() || null,
        notes: notes.trim() || null,
      });
      if (result.success) {
        toast.success('Reação registrada.');
        if (status === 'active') {
          toast.warning(
            'Esta reação aparecerá em alertas no próximo atendimento desta cliente.',
            { duration: 6000 },
          );
        }
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Erro ao registrar.');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar reação</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.14em]">Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as ReactionType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.14em]">Quando ocorreu</Label>
                <Select value={when} onValueChange={(v) => setWhen(v as ReactionWhen)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WHENS.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-[0.14em]">Status atual</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ReactionStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-[0.14em]">
                Sintomas observados *
              </Label>
              <Textarea
                rows={3}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Ex: Vermelhidão localizada, coceira leve…"
                maxLength={2000}
                disabled={pending}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-[0.14em]">
                Tratamento aplicado
              </Label>
              <Textarea
                rows={2}
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                placeholder="Ex: Compressa fria por 10 min…"
                maxLength={2000}
                disabled={pending}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-[0.14em]">Observações</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Histórico, recomendações de retorno…"
                maxLength={2000}
                disabled={pending}
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button variant="premium" onClick={handleSubmit} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar reação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
