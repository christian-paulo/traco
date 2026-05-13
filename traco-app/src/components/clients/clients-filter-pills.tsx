'use client';

import { AlarmClock, BarChart3, GhostIcon, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';

export type ClientsFilter =
  | 'todas'
  | 'retornos'
  | 'sumidos'
  | 'recuperar'
  | 'relatorios';

type Props = {
  recoverCount: number;
  active: ClientsFilter;
};

export function ClientsFilterPills({ recoverCount, active }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildHref(filtro: ClientsFilter): string {
    const params = new URLSearchParams(searchParams.toString());
    if (filtro === 'todas') params.delete('filtro');
    else params.set('filtro', filtro);
    // Limpa params específicos de outras abas pra não confundir state
    if (filtro !== 'retornos' && filtro !== 'sumidos') {
      params.delete('dias');
      params.delete('procedimento');
      params.delete('min');
    }
    if (filtro !== 'relatorios') {
      params.delete('range');
      params.delete('from');
      params.delete('to');
      params.delete('tipo');
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="-mx-1 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto px-1 py-1">
      <Pill href={buildHref('todas')} active={active === 'todas'}>
        Todas
      </Pill>
      <Pill
        href={buildHref('retornos')}
        active={active === 'retornos'}
        tone="gold"
        icon={<RotateCcw className="size-3" />}
      >
        Retornos
      </Pill>
      <Pill
        href={buildHref('sumidos')}
        active={active === 'sumidos'}
        tone="amber"
        icon={<GhostIcon className="size-3" />}
      >
        Sumidas
      </Pill>
      {recoverCount > 0 || active === 'recuperar' ? (
        <Pill
          href={buildHref('recuperar')}
          active={active === 'recuperar'}
          tone="red"
          icon={<AlarmClock className="size-3" />}
          badge={recoverCount > 0 ? recoverCount : undefined}
        >
          Em recuperação
        </Pill>
      ) : null}
      <Pill
        href={buildHref('relatorios')}
        active={active === 'relatorios'}
        icon={<BarChart3 className="size-3" />}
      >
        Relatórios
      </Pill>
    </div>
  );
}

type PillTone = 'default' | 'gold' | 'amber' | 'red';

function Pill({
  href,
  active,
  tone = 'default',
  icon,
  badge,
  children,
}: {
  href: string;
  active: boolean;
  tone?: PillTone;
  icon?: React.ReactNode;
  badge?: number;
  children: React.ReactNode;
}) {
  const toneClass = {
    default: active
      ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-foreground'
      : 'border-cream-dark text-muted-foreground hover:border-[var(--gold)]/40',
    gold: active
      ? 'border-[var(--gold)] bg-[var(--gold)]/15 text-foreground'
      : 'border-cream-dark text-foreground/70 hover:border-[var(--gold)]/40',
    amber: active
      ? 'border-amber-400 bg-amber-50 text-amber-900'
      : 'border-amber-300/60 text-amber-800 hover:bg-amber-50',
    red: active
      ? 'border-red-400 bg-red-50 text-red-900'
      : 'border-red-300/60 text-red-800 hover:bg-red-50',
  }[tone];

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] transition-colors',
        toneClass,
      )}
    >
      {icon}
      {children}
      {badge !== undefined ? (
        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
