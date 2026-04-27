'use client';

import * as React from 'react';

import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';

type FormFieldProProps = React.ComponentProps<'div'> & {
  label: string;
  required?: boolean;
  hint?: string;
  controlClassName?: string;
};

export function FormFieldPro({
  label,
  required,
  hint,
  className,
  children,
  controlClassName,
  ...props
}: FormFieldProProps) {
  return (
    <FormItem className={cn('flex flex-col gap-1.5', className)} {...props}>
      <FormLabel className="flex items-center gap-1 text-xs font-medium uppercase tracking-[0.15em] text-foreground">
        <span>{label}</span>
        {required ? (
          <span aria-hidden className="text-destructive/80">
            *
          </span>
        ) : null}
      </FormLabel>
      <FormControl className={controlClassName}>{children as React.ReactElement}</FormControl>
      {hint ? <p className="text-xs text-muted-foreground/80">{hint}</p> : null}
      <FormMessage className="mt-0 text-xs" />
    </FormItem>
  );
}
