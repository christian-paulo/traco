import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, ArrowRight, Calendar, RotateCcw } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { getInitials } from '@/lib/format';
import type { ClientReturnRow } from '@/lib/queries/clients-followup';
import { cn } from '@/lib/utils';

type Props = {
  returns: ClientReturnRow[];
  totalCount: number;
};

export function ReturnsAlertCard({ returns, totalCount }: Props) {
  if (returns.length === 0) return null;

  const overdueCount = returns.filter((r) => r.isOverdue).length;
  const top3 = returns.slice(0, 3);

  return (
    <Link href="/dashboard/clientes?filtro=retornos" className="block">
      <Card
        variant="premium"
        className={cn(
          'border-0 transition-all hover:shadow-md',
          overdueCount > 0
            ? 'bg-card ring-1 ring-red-300'
            : 'bg-card ring-1 ring-[var(--gold)]/40',
        )}
      >
        <CardContent className="flex flex-col gap-4 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full',
                  overdueCount > 0 ? 'bg-red-100 text-red-700' : 'bg-[var(--gold)]/15 text-[var(--gold)]',
                )}
              >
                {overdueCount > 0 ? (
                  <AlertTriangle className="size-5" strokeWidth={1.75} />
                ) : (
                  <RotateCcw className="size-5" strokeWidth={1.75} />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="font-serif text-lg font-medium leading-tight text-foreground">
                  {overdueCount > 0
                    ? `${overdueCount} ${overdueCount === 1 ? 'cliente atrasada' : 'clientes atrasadas'}`
                    : 'Hora de contatar retornos'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totalCount}{' '}
                  {totalCount === 1 ? 'cliente precisa' : 'clientes precisam'} de contato
                  esta semana
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          </div>

          <ul className="flex flex-col gap-2">
            {top3.map((r) => (
              <li
                key={r.clientId}
                className="flex items-center gap-3 rounded-lg bg-cream/40 px-3 py-2.5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cream text-[10px] font-medium text-[var(--gold)] ring-1 ring-[var(--gold)]/30">
                  {getInitials(r.fullName)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="truncate text-sm font-medium text-foreground">
                    {r.fullName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    <Calendar className="mr-1 inline size-2.5" />
                    {r.isOverdue ? (
                      <span className="text-red-700">
                        Atrasada {Math.abs(r.daysUntilReturn)}{' '}
                        {Math.abs(r.daysUntilReturn) === 1 ? 'dia' : 'dias'}
                      </span>
                    ) : r.daysUntilReturn === 0 ? (
                      <span className="text-amber-700">Hoje</span>
                    ) : (
                      <>
                        {format(new Date(`${r.expectedReturnDate}T00:00:00`), "dd 'de' MMM", {
                          locale: ptBR,
                        })}{' '}
                        · faltam {r.daysUntilReturn}{' '}
                        {r.daysUntilReturn === 1 ? 'dia' : 'dias'}
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {totalCount > 3 ? (
            <p className="text-center text-xs font-medium uppercase tracking-[0.16em] text-[var(--gold)]">
              + {totalCount - 3} {totalCount - 3 === 1 ? 'cliente' : 'clientes'} — ver
              todas
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
