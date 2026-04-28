import { ArrowDown, ArrowUp, type LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MetricCardProps = {
  label: string;
  value: string;
  prefix?: string;
  icon: LucideIcon;
  delta?: { pct: number | null; label?: string };
  highlight?: 'positive' | 'negative' | 'neutral';
};

export function MetricCard({ label, value, prefix, icon: Icon, delta, highlight }: MetricCardProps) {
  const deltaTone =
    delta?.pct === null || delta?.pct === undefined
      ? 'muted'
      : delta.pct > 0
        ? 'positive'
        : delta.pct < 0
          ? 'negative'
          : 'muted';

  return (
    <Card variant="premium" className="bg-card gap-3 border-0 ring-1 ring-[var(--border)] py-6">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 px-6 pb-0">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <Icon className="size-4 text-[var(--gold)]" strokeWidth={1.5} />
      </CardHeader>
      <CardContent className="flex flex-col gap-2 px-6">
        <p className="font-serif font-medium leading-none text-foreground">
          {prefix ? (
            <>
              <span className="text-2xl text-muted-foreground">{prefix}</span>{' '}
              <span className="text-3xl">{value}</span>
            </>
          ) : (
            <span className="text-3xl">{value}</span>
          )}
        </p>
        {delta ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 self-start text-xs font-medium',
              deltaTone === 'positive' && 'text-emerald-600',
              deltaTone === 'negative' && 'text-destructive',
              deltaTone === 'muted' && 'text-muted-foreground',
              highlight === 'positive' && 'text-emerald-600',
              highlight === 'negative' && 'text-destructive',
            )}
          >
            {delta.pct === null || delta.pct === undefined ? (
              <span>{delta.label ?? 'sem comparação'}</span>
            ) : (
              <>
                {delta.pct > 0 ? (
                  <ArrowUp className="size-3" />
                ) : delta.pct < 0 ? (
                  <ArrowDown className="size-3" />
                ) : null}
                {Math.abs(delta.pct).toFixed(1)}% {delta.label ?? 'vs. período anterior'}
              </>
            )}
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
