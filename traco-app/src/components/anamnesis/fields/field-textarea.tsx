import { Textarea } from '@/components/ui/textarea';
import type { TemplateField } from '@/lib/anamnesis/template-types';

import { FieldShell } from './field-shell';

type Props = {
  field: TemplateField;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  disabled?: boolean;
};

export function FieldTextarea({ field, value, onChange, error, disabled }: Props) {
  return (
    <FieldShell id={field.id} label={field.label} required={field.required} error={error}>
      <Textarea
        id={field.id}
        rows={field.rows ?? 3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-card"
      />
    </FieldShell>
  );
}
