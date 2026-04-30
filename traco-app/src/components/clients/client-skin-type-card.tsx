'use client';

import { Sparkles } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { updateClientSkinType } from '@/server/actions/clients';

const PHOTOTYPES = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;

const PHOTOTYPE_DESC: Record<(typeof PHOTOTYPES)[number], string> = {
  I: 'Pele muito clara — sempre queima, nunca bronzeia',
  II: 'Pele clara — geralmente queima, bronzeia com dificuldade',
  III: 'Pele morena clara — às vezes queima, bronzeia gradualmente',
  IV: 'Pele morena — raramente queima, bronzeia com facilidade',
  V: 'Pele negra clara — quase nunca queima, bronzeia muito',
  VI: 'Pele negra — nunca queima, sempre pigmentada',
};

type Props = {
  clientId: string;
  current: string | null;
};

export function ClientSkinTypeCard({ clientId, current }: Props) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<string | null>(current);

  function update(next: string | null) {
    const previous = value;
    setValue(next);
    startTransition(async () => {
      const result = await updateClientSkinType(clientId, next);
      if (result.success) {
        toast.success('Fototipo atualizado.');
      } else {
        setValue(previous);
        toast.error(result.error || 'Erro ao atualizar fototipo.');
      }
    });
  }

  return (
    <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
      <CardHeader className="px-6 pb-2">
        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium">
          <Sparkles className="size-4 text-[var(--gold)]" />
          Tipo de pele (Fitzpatrick)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-6">
        <div className="flex flex-wrap gap-2">
          {PHOTOTYPES.map((type) => {
            const isActive = value === type;
            return (
              <button
                key={type}
                type="button"
                disabled={pending}
                onClick={() => update(isActive ? null : type)}
                className={cn(
                  'inline-flex h-10 min-w-12 items-center justify-center rounded-md border px-3 text-sm font-medium uppercase tracking-wider transition-colors',
                  isActive
                    ? 'border-[var(--gold)] bg-[var(--gold)] text-ink'
                    : 'border-cream-dark bg-card text-foreground/70 hover:border-[var(--gold)]/60 hover:text-foreground',
                  pending && 'opacity-60',
                )}
                aria-pressed={isActive}
              >
                {type}
              </button>
            );
          })}
        </div>
        {value ? (
          <p className="text-xs text-muted-foreground">{PHOTOTYPE_DESC[value as (typeof PHOTOTYPES)[number]]}</p>
        ) : (
          <p className="text-xs italic text-muted-foreground">
            Toque em um fototipo para registrar — ajuda a ajustar técnica e produtos.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
