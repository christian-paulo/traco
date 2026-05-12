'use client';

import { Briefcase } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { StepShell } from '@/components/onboarding/step-shell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format';
import type { ProcedureRow } from '@/lib/queries/procedures';
import { cn } from '@/lib/utils';
import { toggleProcedureActive, updateProcedure } from '@/server/actions/procedures';
import { advanceOnboardingStep } from '@/server/actions/onboarding';

type Props = {
  procedures: ProcedureRow[];
};

type DraftMap = Record<
  string,
  { price: string; returnDays: string; active: boolean }
>;

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
  const [pending, startTransition] = useTransition();

  const activeCount = Object.values(drafts).filter((d) => d.active).length;
  const isValid = activeCount >= 1;

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

  function handleContinue() {
    if (!isValid) return;
    startTransition(async () => {
      // Sync ativação e valores em paralelo
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
      description="Selecione os procedimentos que você faz hoje e ajuste valor e dias pra retorno. Você pode editar tudo depois e adicionar novos em Configurações."
      onContinue={handleContinue}
      continueDisabled={!isValid}
      continuePending={pending}
    >
      <div className="flex flex-col gap-3">
        {procedures.map((p) => {
          const draft = drafts[p.id];
          const isActive = draft?.active ?? false;
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
              <button
                type="button"
                onClick={() => toggle(p.id)}
                className="flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3">
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
                </div>
                <span
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
                    isActive ? 'bg-[var(--gold)]' : 'bg-muted',
                  )}
                  aria-hidden
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-5 rounded-full bg-background shadow transition-all',
                      isActive ? 'left-5' : 'left-0.5',
                    )}
                  />
                </span>
              </button>

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
