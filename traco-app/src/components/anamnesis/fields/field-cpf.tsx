import { Input } from '@/components/ui/input';
import type { TemplateField } from '@/lib/anamnesis/template-types';
import { formatCPF } from '@/lib/validations/cpf';

import { FieldShell } from './field-shell';

type Props = {
  field: TemplateField;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  disabled?: boolean;
};

export function FieldCPF({ field, value, onChange, error, disabled }: Props) {
  return (
    <FieldShell id={field.id} label={field.label} required={field.required} error={error}>
      <Input
        id={field.id}
        inputMode="numeric"
        autoComplete="off"
        placeholder="000.000.000-00"
        value={value}
        onChange={(e) => onChange(formatCPF(e.target.value))}
        disabled={disabled}
        className="h-12 bg-card font-mono"
      />
    </FieldShell>
  );
}
