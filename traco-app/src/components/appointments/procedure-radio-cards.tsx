'use client';

import { formatCurrency } from '@/lib/format';
import type { ProcedureRow } from '@/lib/queries/procedures';
import { cn } from '@/lib/utils';

type Props = {
  procedures: ProcedureRow[];
  value: string | null;
  onChange: (procedure: ProcedureRow) => void;
  disabled?: boolean;
};

export function ProcedureRadioCards({ procedures, value, onChange, disabled }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Selecione o procedimento"
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
    >
      {procedures.map((p) => {
        const selected = value === p.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(p)}
            className={cn(
              'flex items-start gap-3 rounded-lg border-2 bg-card p-3 text-left transition-colors',
              selected
                ? 'border-[var(--gold)] bg-[var(--gold)]/5'
                : 'border-border hover:border-[var(--gold)]/40',
              disabled && 'opacity-60 pointer-events-none',
            )}
          >
            <span
              className="mt-1 size-3 shrink-0 rounded-full"
              style={{ backgroundColor: p.color }}
              aria-hidden
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="font-serif text-base font-medium leading-tight text-foreground">
                {p.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(p.default_price)} · {p.default_return_days} dias
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
