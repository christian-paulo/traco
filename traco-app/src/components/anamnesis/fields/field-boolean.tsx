import type { TemplateField } from '@/lib/anamnesis/template-types';
import { cn } from '@/lib/utils';

import { FieldShell } from './field-shell';

type Props = {
  field: TemplateField;
  value: boolean | undefined;
  onChange: (next: boolean) => void;
  error?: string;
  disabled?: boolean;
};

export function FieldBoolean({ field, value, onChange, error, disabled }: Props) {
  return (
    <FieldShell id={field.id} label={field.label} required={field.required} error={error}>
      <div role="radiogroup" aria-labelledby={field.id} className="grid grid-cols-2 gap-2">
        {([
          ['Sim', true],
          ['Não', false],
        ] as const).map(([label, optionValue]) => {
          const selected = value === optionValue;
          return (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(optionValue)}
              className={cn(
                'flex h-12 items-center justify-center rounded-lg border-2 text-sm font-medium uppercase tracking-[0.1em] transition-colors',
                selected
                  ? 'border-[var(--gold)] bg-[var(--gold)]/15 text-foreground'
                  : 'border-[var(--gold)]/20 bg-card text-muted-foreground hover:border-[var(--gold)]/50 hover:text-foreground',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </FieldShell>
  );
}
