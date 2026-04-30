import type { TemplateField } from '@/lib/anamnesis/template-types';

import { FieldShell } from './field-shell';

type Props = {
  field: TemplateField;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  disabled?: boolean;
};

export function FieldSelect({ field, value, onChange, error, disabled }: Props) {
  return (
    <FieldShell
      id={field.id}
      label={field.label}
      required={field.required}
      hint={field.help}
      error={error}
    >
      <select
        id={field.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-12 w-full rounded-lg border border-cream-dark bg-card px-4 text-sm text-foreground outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">Selecione</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
