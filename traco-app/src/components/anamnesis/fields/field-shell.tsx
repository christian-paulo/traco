import * as React from 'react';

import { cn } from '@/lib/utils';

type Props = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function FieldShell({ id, label, required, hint, error, children, className }: Props) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label
        htmlFor={id}
        className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.15em] text-foreground"
      >
        <span>{label}</span>
        {required ? (
          <span aria-hidden className="text-destructive/80">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground/80">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
