import { Input } from '@/components/ui/input';
import type { TemplateField } from '@/lib/anamnesis/template-types';
import { formatPhoneBR } from '@/lib/utils/phone';

import { FieldShell } from './field-shell';

type Props = {
  field: TemplateField;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  disabled?: boolean;
};

export function FieldPhone({ field, value, onChange, error, disabled }: Props) {
  return (
    <FieldShell id={field.id} label={field.label} required={field.required} error={error}>
      <Input
        id={field.id}
        inputMode="tel"
        autoComplete="tel"
        placeholder="(11) 99999-9999"
        value={value}
        onChange={(e) => onChange(formatPhoneBR(e.target.value))}
        disabled={disabled}
        className="h-12 bg-card"
      />
    </FieldShell>
  );
}
