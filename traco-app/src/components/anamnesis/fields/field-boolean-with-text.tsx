import { Textarea } from '@/components/ui/textarea';
import type { TemplateField } from '@/lib/anamnesis/template-types';
import { cn } from '@/lib/utils';

import { FieldShell } from './field-shell';

export type BooleanWithText = { value: boolean; text: string };

type Props = {
  field: TemplateField;
  value: BooleanWithText | undefined;
  onChange: (next: BooleanWithText) => void;
  error?: string;
  disabled?: boolean;
};

export function FieldBooleanWithText({ field, value, onChange, error, disabled }: Props) {
  const current = value ?? { value: false, text: '' };

  function setBoolean(next: boolean) {
    onChange({ value: next, text: next ? current.text : '' });
  }

  function setText(next: string) {
    onChange({ ...current, text: next });
  }

  return (
    <FieldShell id={field.id} label={field.label} required={field.required} error={error}>
      <div className="flex flex-col gap-3">
        <div role="radiogroup" aria-labelledby={field.id} className="grid grid-cols-2 gap-2">
          {([
            ['Sim', true],
            ['Não', false],
          ] as const).map(([label, optionValue]) => {
            const selected = value !== undefined && current.value === optionValue;
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={disabled}
                onClick={() => setBoolean(optionValue)}
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

        {current.value ? (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`${field.id}-text`}
              className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground"
            >
              {field.text_label ?? 'Detalhe'}
            </label>
            <Textarea
              id={`${field.id}-text`}
              rows={2}
              value={current.text}
              onChange={(e) => setText(e.target.value)}
              disabled={disabled}
              className="bg-card"
            />
          </div>
        ) : null}
      </div>
    </FieldShell>
  );
}
