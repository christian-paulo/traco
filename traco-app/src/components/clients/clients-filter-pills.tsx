'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';

type Props = {
  recoverCount: number;
  active: 'todas' | 'recuperar';
};

export function ClientsFilterPills({ recoverCount, active }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(filtro: 'todas' | 'recuperar'): string {
    const params = new URLSearchParams(searchParams.toString());
    if (filtro === 'recuperar') params.set('filtro', 'recuperar');
    else params.delete('filtro');
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={buildHref('todas')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] transition-colors',
          active === 'todas'
            ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-foreground'
            : 'border-cream-dark text-muted-foreground hover:border-[var(--gold)]/40',
        )}
      >
        Todas
      </Link>
      {recoverCount > 0 || active === 'recuperar' ? (
        <Link
          href={buildHref('recuperar')}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] transition-colors',
            active === 'recuperar'
              ? 'border-amber-400 bg-amber-50 text-amber-900'
              : 'border-amber-300/60 text-amber-800 hover:bg-amber-50',
          )}
        >
          Em recuperação
          {recoverCount > 0 ? (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] text-white">
              {recoverCount}
            </span>
          ) : null}
        </Link>
      ) : null}
    </div>
  );
}
