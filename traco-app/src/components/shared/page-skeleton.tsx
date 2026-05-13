import { cn } from '@/lib/utils';

export function PageSkeleton({
  title,
  subtitle,
  blocks = 3,
}: {
  title?: string;
  subtitle?: string;
  blocks?: number;
}) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="h-px w-8 bg-[var(--gold)]" />
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          {title ?? 'Carregando…'}
        </h1>
        {subtitle ? (
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </header>

      <div className="flex flex-col gap-4">
        {Array.from({ length: blocks }, (_, i) => (
          <SkeletonBlock key={i} delayMs={i * 80} />
        ))}
      </div>
    </div>
  );
}

function SkeletonBlock({ delayMs }: { delayMs: number }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-cream-dark bg-card p-5',
        'animate-pulse',
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="mb-3 h-3 w-32 rounded bg-cream-dark/70" />
      <div className="h-8 w-44 rounded bg-cream-dark/60" />
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="h-16 rounded-md bg-cream-dark/40" />
        <div className="h-16 rounded-md bg-cream-dark/40" />
        <div className="h-16 rounded-md bg-cream-dark/40" />
      </div>
    </div>
  );
}
