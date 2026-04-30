import { AlertTriangle, CalendarDays, Play } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import type { TodayAppointmentSummary } from '@/lib/queries/dashboard';
import { cn } from '@/lib/utils';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendente', cls: 'border-amber-300 bg-amber-50 text-amber-800' },
  confirmed: { label: 'Confirmado', cls: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  completed: { label: 'Concluído', cls: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  cancelled: { label: 'Cancelado', cls: 'border-red-300 bg-red-50 text-red-700' },
  no_show: {
    label: 'Não compareceu',
    cls: 'border-muted-foreground/30 bg-muted text-muted-foreground',
  },
};

function formatHHMM(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type Props = {
  appointments: TodayAppointmentSummary[];
};

export function TodayAppointmentsCard({ appointments }: Props) {
  return (
    <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-3">
        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium">
          <CalendarDays className="size-4 text-[var(--gold)]" />
          Atendimentos de hoje
        </CardTitle>
        {appointments.length > 0 ? (
          <Badge variant="outline" className="border-[var(--gold)]/40 bg-[var(--gold)]/10">
            {appointments.length}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="px-6">
        {appointments.length === 0 ? (
          <p className="font-serif text-base italic text-muted-foreground">
            Sem atendimentos agendados pra hoje.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-cream-dark">
            {appointments.map((a) => {
              const status = STATUS_META[a.status] ?? STATUS_META.confirmed;
              const canStart =
                a.status !== 'cancelled' && a.status !== 'completed' && a.status !== 'no_show';
              return (
                <li key={a.id}>
                  <div className="-mx-2 flex flex-col gap-1.5 rounded-md px-2 py-3 sm:flex-row sm:items-center sm:gap-3">
                    <span
                      className="inline-block size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: a.procedure_color }}
                      aria-hidden
                    />
                    <span className="font-mono text-base font-medium tracking-tight text-foreground">
                      {formatHHMM(a.scheduled_start_at)}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                        {a.client_name}
                        {a.has_active_reaction ? (
                          <span
                            className="inline-flex size-4 items-center justify-center rounded-full bg-red-100 text-red-600"
                            title="Cliente tem reação ativa"
                          >
                            <AlertTriangle className="size-3" strokeWidth={2} />
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        {a.procedure_name} · {formatCurrency(a.price)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'shrink-0 text-[10px] uppercase tracking-[0.1em]',
                        status.cls,
                      )}
                    >
                      {status.label}
                    </Badge>
                    {canStart ? (
                      <Link
                        href={`/atendimento/${a.id}`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--gold)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-ink shadow-sm transition-all hover:scale-105"
                        aria-label={`Iniciar atendimento de ${a.client_name}`}
                      >
                        <Play className="size-3 fill-current" />
                        Iniciar
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
