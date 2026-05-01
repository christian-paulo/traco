'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  GOAL_PERIODS,
  GOAL_PERIOD_LABELS,
  GOAL_TYPES,
  GOAL_TYPE_LABELS,
  type GoalPeriod,
  type GoalType,
} from '@/lib/validations/goal';
import { createGoal, updateGoal } from '@/server/actions/goals';

export type EditableGoal = {
  id: string;
  type: GoalType;
  target_value: number;
  period_type: GoalPeriod;
  start_date: string;
  end_date: string;
  title: string;
  description: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: EditableGoal | null;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function toIso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function rangeForPeriod(period: GoalPeriod): { start: string; end: string } {
  const today = new Date();
  switch (period) {
    case 'week': {
      // semana: hoje até 6 dias depois
      const end = new Date(today);
      end.setDate(today.getDate() + 6);
      return { start: toIso(today), end: toIso(end) };
    }
    case 'month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { start: toIso(start), end: toIso(end) };
    }
    case 'quarter': {
      const q = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), q * 3, 1);
      const end = new Date(today.getFullYear(), q * 3 + 3, 0);
      return { start: toIso(start), end: toIso(end) };
    }
    case 'year': {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31);
      return { start: toIso(start), end: toIso(end) };
    }
  }
}

function defaultTitle(type: GoalType, period: GoalPeriod, target: number): string {
  const periodLabel = GOAL_PERIOD_LABELS[period].toLowerCase();
  const typeLabel = GOAL_TYPE_LABELS[type];
  if (type === 'revenue') {
    const fmt = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
    return `Meta de ${fmt.format(target)} no ${periodLabel}`;
  }
  return `${target} ${typeLabel.toLowerCase()} no ${periodLabel}`;
}

export function GoalFormDialog({ open, onOpenChange, goal }: Props) {
  const isEdit = Boolean(goal);
  const [type, setType] = useState<GoalType>('revenue');
  const [period, setPeriod] = useState<GoalPeriod>('month');
  const [target, setTarget] = useState('5000');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleManuallyEdited, setTitleManuallyEdited] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    if (goal) {
      setType(goal.type);
      setPeriod(goal.period_type);
      setTarget(goal.target_value.toString());
      setStartDate(goal.start_date);
      setEndDate(goal.end_date);
      setTitle(goal.title);
      setDescription(goal.description ?? '');
      setTitleManuallyEdited(true);
    } else {
      setType('revenue');
      setPeriod('month');
      setTarget('5000');
      const range = rangeForPeriod('month');
      setStartDate(range.start);
      setEndDate(range.end);
      setTitle(defaultTitle('revenue', 'month', 5000));
      setDescription('');
      setTitleManuallyEdited(false);
    }
  }, [open, goal]);

  const targetNumber = useMemo(() => {
    const n = Number(target.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }, [target]);

  // Quando muda período/tipo/target e título não foi editado manualmente, regenera
  useEffect(() => {
    if (!open || isEdit || titleManuallyEdited) return;
    setTitle(defaultTitle(type, period, targetNumber));
  }, [open, type, period, targetNumber, isEdit, titleManuallyEdited]);

  function handlePeriodChange(next: GoalPeriod) {
    setPeriod(next);
    if (!isEdit) {
      const range = rangeForPeriod(next);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(targetNumber) || targetNumber <= 0) {
      toast.error('Defina um alvo maior que zero.');
      return;
    }
    if (!startDate || !endDate || endDate < startDate) {
      toast.error('Datas inválidas.');
      return;
    }
    if (title.trim().length < 3) {
      toast.error('Título obrigatório.');
      return;
    }

    const payload = {
      type,
      period_type: period,
      target_value: targetNumber,
      start_date: startDate,
      end_date: endDate,
      title: title.trim(),
      description: description.trim() || null,
    };

    startTransition(async () => {
      const result =
        isEdit && goal
          ? await updateGoal(goal.id, payload)
          : await createGoal(payload);
      if (result.success) {
        toast.success(isEdit ? 'Meta atualizada.' : 'Meta criada.');
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar meta' : 'Nova meta'}</DialogTitle>
          <DialogDescription>
            Defina alvo e período. O progresso é recalculado automaticamente conforme você atende.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-[0.16em]">Tipo</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType((v ?? 'revenue') as GoalType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {GOAL_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-[0.16em]">Período</Label>
                  <Select
                    value={period}
                    onValueChange={(v) => handlePeriodChange((v ?? 'month') as GoalPeriod)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_PERIODS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {GOAL_PERIOD_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">
                  Alvo {type === 'revenue' ? '(R$)' : ''}
                </Label>
                <Input
                  type="number"
                  step={type === 'revenue' ? '0.01' : '1'}
                  min="1"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  disabled={pending}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-[0.16em]">Início</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={pending}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs uppercase tracking-[0.16em]">Fim</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={pending}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">Título</Label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setTitleManuallyEdited(true);
                  }}
                  maxLength={120}
                  disabled={pending}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">
                  Descrição (opcional)
                </Label>
                <Textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Por que essa meta importa?"
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
            <Button variant="premium" type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isEdit ? 'Salvar' : 'Criar meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
