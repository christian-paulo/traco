'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/lib/format';
import type { ProcedureRow } from '@/lib/queries/procedures';

type Props = {
  procedures: ProcedureRow[];
  value: string | null;
  onChange: (procedure: ProcedureRow) => void;
  disabled?: boolean;
};

export function ProcedureSelect({ procedures, value, onChange, disabled }: Props) {
  function handleChange(next: string | null) {
    if (!next) return;
    const proc = procedures.find((p) => p.id === next);
    if (proc) onChange(proc);
  }

  return (
    <Select value={value ?? ''} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className="h-12 w-full">
        <SelectValue>
          {(current: string | null) => {
            if (!current) {
              return <span className="text-muted-foreground/70">Selecione um procedimento</span>;
            }
            const proc = procedures.find((p) => p.id === current);
            if (!proc) return <span className="text-muted-foreground/70">Selecione um procedimento</span>;
            return (
              <span className="flex w-full items-center justify-between gap-3">
                <span className="flex items-center gap-2.5">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: proc.color }}
                    aria-hidden
                  />
                  <span className="text-sm font-medium text-foreground">{proc.name}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(proc.default_price)}
                </span>
              </span>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {procedures.map((p) => (
          <SelectItem key={p.id} value={p.id} className="py-2.5">
            <span className="flex w-full items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: p.color }}
                aria-hidden
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{p.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(p.default_price)} · {p.default_return_days} dias
                </span>
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
