import { Input } from '@/components/ui/input';
import type { TemplateField } from '@/lib/anamnesis/template-types';

import { FieldShell } from './field-shell';

type Props = {
  field: TemplateField;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  disabled?: boolean;
};

export function FieldDate({ field, value, onChange, error, disabled }: Props) {
  return (
    <FieldShell id={field.id} label={field.label} required={field.required} error={error}>
      <Input
        id={field.id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-12 bg-card"
      />
    </FieldShell>
  );
}
