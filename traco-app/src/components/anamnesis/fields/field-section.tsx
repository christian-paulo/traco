import type { TemplateField } from '@/lib/anamnesis/template-types';

type Props = {
  field: TemplateField;
};

export function FieldSection({ field }: Props) {
  return (
    <div className="flex flex-col gap-1.5 pt-2">
      <div className="h-px w-8 bg-[var(--gold)]" />
      <h2 className="font-serif text-2xl font-medium text-foreground">{field.label}</h2>
      {field.subtitle ? (
        <p className="text-sm text-muted-foreground leading-relaxed">{field.subtitle}</p>
      ) : null}
    </div>
  );
}
