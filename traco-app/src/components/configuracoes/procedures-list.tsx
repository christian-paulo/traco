'use client';

import { Loader2, Plus, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ProcedureRow } from '@/lib/queries/procedures';
import { cn } from '@/lib/utils';
import { createProcedure } from '@/server/actions/procedures';

import { ProcedureCard } from './procedure-card';

type Props = {
  procedures: ProcedureRow[];
};

const DEFAULT_NEW_COLORS = [
  '#C9A961',
  '#A78BFA',
  '#F472B6',
  '#34D399',
  '#FB923C',
  '#60A5FA',
];

export function ProceduresList({ procedures }: Props) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newReturnDays, setNewReturnDays] = useState('30');
  const [newColor, setNewColor] = useState(DEFAULT_NEW_COLORS[0] ?? '#C9A961');
  const [creating, startCreate] = useTransition();

  const newIsValid =
    newName.trim().length >= 2 &&
    Number(newPrice.replace(',', '.')) >= 0 &&
    Number(newReturnDays) >= 1;

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

  return (
    <div className="flex flex-col gap-3">
      {procedures.map((p) => (
        <ProcedureCard key={p.id} procedure={p} />
      ))}

      {showNewForm ? (
        <Card
          variant="premium"
          className="bg-card border-0 py-5 ring-1 ring-[var(--gold)]/40"
        >
          <CardContent className="flex flex-col gap-4 px-6">
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
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[auto_1fr_140px_140px_auto]">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Cor
                </Label>
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  disabled={creating}
                  className="size-11 cursor-pointer rounded-md border border-input bg-transparent p-1"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Nome
                </Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Brow lamination com henna"
                  disabled={creating}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Valor padrão
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="180"
                    disabled={creating}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Retorno (dias)
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={newReturnDays}
                  onChange={(e) => setNewReturnDays(e.target.value)}
                  disabled={creating}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="premium"
                  onClick={handleCreate}
                  disabled={!newIsValid || creating}
                  className="h-10"
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
            <div className="flex flex-wrap gap-1.5">
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
          </CardContent>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowNewForm(true)}
          className="self-start"
        >
          <Plus className="size-4" /> Novo procedimento
        </Button>
      )}
    </div>
  );
}
