'use client';

import { Briefcase, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { StepShell } from '@/components/onboarding/step-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format';
import type { ProcedureRow } from '@/lib/queries/procedures';
import { cn } from '@/lib/utils';
import {
  createProcedure,
  deleteProcedure,
  toggleProcedureActive,
  updateProcedure,
} from '@/server/actions/procedures';
import { advanceOnboardingStep } from '@/server/actions/onboarding';

type Props = {
  procedures: ProcedureRow[];
};

type DraftMap = Record<
  string,
  { price: string; returnDays: string; active: boolean }
>;

const DEFAULT_NEW_COLORS = [
  '#C9A961', // gold
  '#A78BFA', // violet
  '#F472B6', // pink
  '#34D399', // emerald
  '#FB923C', // orange
  '#60A5FA', // blue
];

export function StepProcedures({ procedures }: Props) {
  const [drafts, setDrafts] = useState<DraftMap>(() =>
    Object.fromEntries(
      procedures.map((p) => [
        p.id,
        {
          price: String(p.default_price ?? 0),
          returnDays: String(p.default_return_days ?? 30),
          active: p.is_active,
        },
      ]),
    ),
  );
  const [showNewForm, setShowNewForm] = useState(procedures.length === 0);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newReturnDays, setNewReturnDays] = useState('30');
  const [newColor, setNewColor] = useState(DEFAULT_NEW_COLORS[0] ?? '#C9A961');
  const [pending, startTransition] = useTransition();
  const [creating, startCreate] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeCount = procedures.filter((p) => drafts[p.id]?.active ?? false).length;
  const isValid = activeCount >= 1;
  const newIsValid =
    newName.trim().length >= 2 && Number(newPrice.replace(',', '.')) >= 0 && Number(newReturnDays) >= 1;

  function toggle(id: string) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], active: !prev[id].active },
    }));
  }

  function updateField(id: string, field: 'price' | 'returnDays', value: string) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  function handleCreate() {
    if (!newIsValid) return;
    startCreate(async () => {
      const result = await createProcedure({
        name: newName.trim(),
        default_price: Number(newPrice.replace(',', '.')),
        default_return_days: Number(newReturnDays),
        color: newColor,
        is_active: true,
      });
      if (result.success) {
        toast.success('Procedimento criado.');
        setNewName('');
        setNewPrice('');
        setNewReturnDays('30');
        setNewColor(DEFAULT_NEW_COLORS[0] ?? '#C9A961');
        setShowNewForm(false);
      } else {
        toast.error(result.error || 'Erro ao criar.');
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir "${name}"?`)) return;
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteProcedure(id);
      if (result.success) {
        toast.success('Procedimento excluído.');
      } else {
        toast.error(result.error || 'Erro ao excluir.');
      }
      setDeletingId(null);
    });
  }

  function handleContinue() {
    if (!isValid) return;
    startTransition(async () => {
      const tasks = procedures.map(async (p) => {
        const draft = drafts[p.id];
        if (!draft) return;
        const price = Number(draft.price.replace(',', '.'));
        const returnDays = Number(draft.returnDays);
        const priceChanged = Number.isFinite(price) && price !== p.default_price;
        const daysChanged = Number.isFinite(returnDays) && returnDays !== p.default_return_days;
        if (priceChanged || daysChanged) {
          await updateProcedure(p.id, {
            name: p.name,
            default_price: Number.isFinite(price) ? price : p.default_price,
            default_return_days: Number.isFinite(returnDays) ? returnDays : p.default_return_days,
            color: p.color,
          });
        }
        if (draft.active !== p.is_active) {
          await toggleProcedureActive(p.id);
        }
      });
      await Promise.all(tasks);

      const advanced = await advanceOnboardingStep('procedures');
      if (!advanced.success) toast.error(advanced.error || 'Erro ao avançar.');
    });
  }

  return (
    <StepShell
      step="procedures"
      subtitle="Passo 3 de 5"
      title="O que você oferece?"
      description="Selecione os procedimentos que você faz hoje, ajuste valor e dias pra retorno. Pode adicionar novos a qualquer momento."
      onContinue={handleContinue}
      continueDisabled={!isValid}
      continuePending={pending}
    >
      <div className="flex flex-col gap-3">
        {procedures.map((p) => {
          const draft = drafts[p.id];
          const isActive = draft?.active ?? false;
          const isDeleting = deletingId === p.id;
          return (
            <div
              key={p.id}
              className={cn(
                'flex flex-col gap-3 rounded-xl border p-4 transition-all',
                isActive
                  ? 'border-[var(--gold)]/40 bg-card ring-1 ring-[var(--gold)]/30'
                  : 'border-cream-dark bg-cream/30',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span
                    aria-hidden
                    className="inline-block size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="flex flex-col gap-0.5">
                    <p className="font-serif text-base font-medium leading-tight text-foreground">
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isActive ? 'Você oferece' : 'Não oferece'}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
                      isActive ? 'bg-[var(--gold)]' : 'bg-muted',
                    )}
                    aria-label={isActive ? 'Desativar' : 'Ativar'}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 size-5 rounded-full bg-background shadow transition-all',
                        isActive ? 'left-5' : 'left-0.5',
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id, p.name)}
                    disabled={pending}
                    aria-label="Excluir procedimento"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {isActive && draft ? (
                <div className="grid grid-cols-2 gap-3 border-t border-cream-dark pt-3">
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Valor (R$)
                    </Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={draft.price}
                      onChange={(e) => updateField(p.id, 'price', e.target.value)}
                      disabled={pending}
                      className="h-9"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Default: {formatCurrency(p.default_price)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Retorno (dias)
                    </Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      value={draft.returnDays}
                      onChange={(e) => updateField(p.id, 'returnDays', e.target.value)}
                      disabled={pending}
                      className="h-9"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Default: {p.default_return_days} dias
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {showNewForm ? (
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--gold)]/40 bg-card p-4 ring-1 ring-[var(--gold)]/20">
          <div className="flex items-center justify-between">
            <p className="font-serif text-base font-medium text-foreground">
              Novo procedimento
            </p>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              disabled={creating}
              aria-label="Cancelar"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-cream"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[auto_1fr] items-end gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Cor
                </Label>
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  disabled={creating}
                  className="size-9 cursor-pointer rounded-md border border-cream-dark bg-transparent p-1"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Nome do procedimento
                </Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Brow lamination com henna"
                  disabled={creating}
                  className="h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Valor (R$)
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="180"
                  disabled={creating}
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Retorno (dias)
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={newReturnDays}
                  onChange={(e) => setNewReturnDays(e.target.value)}
                  placeholder="30"
                  disabled={creating}
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex gap-1.5">
              {DEFAULT_NEW_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  disabled={creating}
                  aria-label={`Cor ${c}`}
                  className={cn(
                    'size-6 rounded-full transition-all',
                    newColor === c
                      ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground'
                      : 'hover:scale-110',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="premium"
              onClick={handleCreate}
              disabled={!newIsValid || creating}
              className="self-start"
            >
              {creating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Adicionar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowNewForm(true)}
          disabled={pending}
          className="self-start"
        >
          <Plus className="size-4" /> Adicionar procedimento
        </Button>
      )}

      {!isValid ? (
        <p className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          <Briefcase className="size-3.5" />
          Marque ao menos 1 procedimento pra continuar.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {activeCount} {activeCount === 1 ? 'procedimento ativo' : 'procedimentos ativos'}.
        </p>
      )}
    </StepShell>
  );
}
