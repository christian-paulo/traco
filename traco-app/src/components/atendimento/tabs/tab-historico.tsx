'use client';

import { CalendarOff, History } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

import type { PastAppointment } from '../atendimento-layout';

type Props = {
  pastAppointments: PastAppointment[];
};

const statusLabel: Record<string, { label: string; className: string }> = {
  scheduled: {
    label: 'Agendado',
    className: 'border-amber-300 bg-amber-50 text-amber-800',
  },
  completed: {
    label: 'Concluído',
    className: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'border-red-300 bg-red-50 text-red-700',
  },
  no_show: {
    label: 'Não compareceu',
    className: 'border-muted-foreground/30 bg-muted text-muted-foreground',
  },
};

export function TabHistorico({ pastAppointments }: Props) {
  if (pastAppointments.length === 0) {
    return (
      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--gold)]/10">
            <CalendarOff className="size-8 text-[var(--gold)]" strokeWidth={1.25} />
          </div>
          <p className="font-serif text-lg italic text-muted-foreground">
            Esta é a primeira visita desta cliente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {pastAppointments.length}{' '}
          {pastAppointments.length === 1 ? 'atendimento' : 'atendimentos'}
        </p>
      </div>

      <div className="relative flex flex-col gap-3 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-cream-dark">
        {pastAppointments.map((appt) => {
          const status = statusLabel[appt.status] ?? {
            label: appt.status,
            className: 'border-muted-foreground/30 bg-muted text-muted-foreground',
          };
          return (
            <div key={appt.id} className="relative">
              <span
                className="absolute -left-[1.4rem] top-3 inline-block size-3 rounded-full border-2 border-[var(--gold)] bg-cream"
                aria-hidden
              />
              <Card
                variant="premium"
                className="bg-card border-0 ring-1 ring-[var(--border)]"
              >
                <CardContent className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-serif text-base font-medium text-foreground">
                        {appt.procedure_name ?? 'Procedimento'}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] uppercase tracking-[0.1em]', status.className)}
                      >
                        {status.label}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <History className="size-3" />
                      {formatDate(appt.performed_at, 'long')}
                    </p>
                  </div>
                  <p className="font-serif text-base font-medium text-[var(--gold)]">
                    {formatCurrency(appt.price)}
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
