'use client';

import { Loader2, Save, Trash2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ProcedureRow } from '@/lib/queries/procedures';
import { cn } from '@/lib/utils';
import { procedureSchema } from '@/lib/validations/procedure';
import {
  deleteProcedure,
  toggleProcedureActive,
  updateProcedure,
} from '@/server/actions/procedures';

type Props = {
  procedure: ProcedureRow;
};

type FormState = {
  name: string;
  default_price: number;
  default_return_days: number;
  color: string;
};

function toFormState(procedure: ProcedureRow): FormState {
  return {
    name: procedure.name,
    default_price: procedure.default_price,
    default_return_days: procedure.default_return_days,
    color: procedure.color,
  };
}

function isDirty(initial: FormState, current: FormState) {
  return (
    initial.name !== current.name ||
    initial.default_price !== current.default_price ||
    initial.default_return_days !== current.default_return_days ||
    initial.color !== current.color
  );
}

export function ProcedureCard({ procedure }: Props) {
  const [initial, setInitial] = useState<FormState>(() => toFormState(procedure));
  const [state, setState] = useState<FormState>(() => toFormState(procedure));
  const [error, setError] = useState<string | null>(null);
  const [savePending, startSave] = useTransition();
  const [togglePending, startToggle] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const dirty = isDirty(initial, state);

  useEffect(() => {
    setInitial(toFormState(procedure));
    setState(toFormState(procedure));
  }, [procedure]);

  function handleSave() {
    setError(null);
    const parsed = procedureSchema.safeParse(state);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Valor inválido.');
      return;
    }
    startSave(async () => {
      const result = await updateProcedure(procedure.id, parsed.data);
      if (result.success) {
        toast.success('Procedimento atualizado.');
        setInitial(state);
      } else {
        toast.error(result.error || 'Não foi possível salvar.');
      }
    });
  }

  function handleToggle() {
    startToggle(async () => {
      const result = await toggleProcedureActive(procedure.id);
      if (!result.success) {
        toast.error(result.error || 'Não foi possível atualizar.');
      } else {
        toast.success(
          procedure.is_active ? 'Procedimento desativado.' : 'Procedimento ativado.',
        );
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Excluir "${procedure.name}"?`)) return;
    startDelete(async () => {
      const result = await deleteProcedure(procedure.id);
      if (!result.success) {
        toast.error(result.error || 'Não foi possível excluir.');
      } else {
        toast.success('Procedimento excluído.');
      }
    });
  }

  return (
    <Card
      variant="premium"
      className={cn(
        'bg-card border-0 ring-1 ring-[var(--border)] py-5 transition-opacity',
        !procedure.is_active && 'opacity-70',
      )}
    >
      <CardContent className="grid grid-cols-1 gap-4 px-6 lg:grid-cols-[auto_1fr_140px_140px_auto_auto_auto] lg:items-end">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Cor
          </Label>
          <input
            type="color"
            aria-label="Cor do procedimento"
            value={state.color}
            onChange={(e) => setState((s) => ({ ...s, color: e.target.value }))}
            className="size-11 cursor-pointer rounded-md border border-input bg-transparent p-1"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`name-${procedure.id}`}
            className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            Nome
          </Label>
          <Input
            id={`name-${procedure.id}`}
            value={state.name}
            onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
            disabled={savePending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`price-${procedure.id}`}
            className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            Valor padrão
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              id={`price-${procedure.id}`}
              type="number"
              step="0.01"
              min="0"
              value={Number.isFinite(state.default_price) ? state.default_price : ''}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  default_price: e.target.value === '' ? 0 : Number(e.target.value),
                }))
              }
              disabled={savePending}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor={`days-${procedure.id}`}
            className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            Retorno (dias)
          </Label>
          <Input
            id={`days-${procedure.id}`}
            type="number"
            min="1"
            max="365"
            value={Number.isFinite(state.default_return_days) ? state.default_return_days : ''}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                default_return_days: e.target.value === '' ? 0 : Number(e.target.value),
              }))
            }
            disabled={savePending}
          />
        </div>

        <div className="flex flex-col items-start gap-1.5">
          <Label
            htmlFor={`active-${procedure.id}`}
            className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            {procedure.is_active ? 'Ativo' : 'Inativo'}
          </Label>
          <Switch
            id={`active-${procedure.id}`}
            checked={procedure.is_active}
            onCheckedChange={handleToggle}
            disabled={togglePending}
          />
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            variant="premium"
            size="default"
            onClick={handleSave}
            disabled={!dirty || savePending}
            className="h-10"
          >
            {savePending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Salvar
          </Button>
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={deletePending}
            aria-label="Excluir procedimento"
            className="h-10 w-10 text-muted-foreground hover:bg-red-50 hover:text-red-600"
          >
            {deletePending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </div>

        {error ? (
          <p className="text-destructive text-xs lg:col-span-7">{error}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
