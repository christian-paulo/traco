import * as React from 'react';

import { cn } from '@/lib/utils';

type FormSectionProps = React.ComponentProps<'section'> & {
  title?: string;
  description?: string;
};

export function FormSection({
  title,
  description,
  className,
  children,
  ...props
}: FormSectionProps) {
  return (
    <section className={cn('mb-8 last:mb-0', className)} {...props}>
      {title || description ? (
        <div className="mb-5 flex flex-col gap-1">
          {title ? (
            <h3 className="font-serif text-base font-medium leading-tight text-foreground">
              {title}
            </h3>
          ) : null}
          {description ? (
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {description}
            </p>
          ) : null}
          <div className="mt-2 h-px w-6 bg-[var(--gold)]" aria-hidden />
        </div>
      ) : null}
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}
