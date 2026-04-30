import type { TemplateField } from '@/lib/anamnesis/template-types';
import { cn } from '@/lib/utils';

type Props = {
  field: TemplateField;
  value: boolean;
  onChange: (next: boolean) => void;
  error?: string;
  disabled?: boolean;
};

export function FieldTermAcceptance({ field, value, onChange, error, disabled }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-cream/40 rounded-lg border border-[var(--gold)]/30 p-4 text-sm leading-relaxed text-foreground">
        {field.term_text}
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-checked={value}
        role="checkbox"
        onClick={() => onChange(!value)}
        className={cn(
          'flex items-start gap-3 rounded-lg border-2 p-3 text-left text-sm transition-colors',
          value
            ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-foreground'
            : 'border-[var(--gold)]/20 bg-card text-muted-foreground hover:border-[var(--gold)]/50',
        )}
      >
        <span
          className={cn(
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
            value
              ? 'border-[var(--gold)] bg-[var(--gold)]'
              : 'border-[var(--gold)]/40 bg-transparent',
          )}
          aria-hidden
        >
          {value ? (
            <svg
              viewBox="0 0 16 16"
              className="size-3 text-[var(--ink)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
        <span className="font-medium uppercase tracking-[0.1em] text-xs">
          Li, compreendi e estou de acordo com o termo acima.
        </span>
      </button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
