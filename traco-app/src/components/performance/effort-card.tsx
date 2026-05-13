import { Briefcase, Calendar, Clock, Users } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { formatMinutesAsHours } from '@/lib/performance/period';

type Props = {
  daysWithAppointments: number;
  appointmentsCount: number;
  uniqueClients: number;
  totalMinutes: number;
  shareHref: string;
};

export function EffortCard({
  daysWithAppointments,
  appointmentsCount,
  uniqueClients,
  totalMinutes,
  shareHref,
}: Props) {
  const rows = [
    {
      icon: Calendar,
      value: daysWithAppointments,
      suffix: daysWithAppointments === 1 ? 'dia' : 'dias',
      label: 'com atendimento',
    },
    {
      icon: Briefcase,
      value: appointmentsCount,
      suffix: appointmentsCount === 1 ? 'atendimento' : 'atendimentos',
      label: 'realizados',
    },
    {
      icon: Users,
      value: uniqueClients,
      suffix: uniqueClients === 1 ? 'cliente' : 'clientes',
      label: 'únicas atendidas',
    },
    {
      icon: Clock,
      value: formatMinutesAsHours(totalMinutes),
      suffix: 'horas',
      label: 'atendidas',
    },
  ];

  return (
    <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
      <CardContent className="flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Esforço no período
          </p>
          <Link href={shareHref}>
            <Button variant="outline-gold" size="sm">
              Compartilhar resumo
            </Button>
          </Link>
        </div>

        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li
              key={r.label}
              className="flex items-center gap-3 rounded-lg bg-cream/40 px-3 py-2.5 ring-1 ring-cream-dark"
            >
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full',
                  'bg-[var(--gold)]/15 text-[var(--gold)]',
                )}
              >
                <r.icon className="size-4" strokeWidth={1.5} />
              </div>
              <div className="flex flex-1 items-baseline gap-2">
                <span className="text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
                  {r.value}
                </span>
                <span className="text-sm font-medium text-foreground">{r.suffix}</span>
                <span className="text-xs text-muted-foreground">{r.label}</span>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Horas calculadas pela duração dos agendamentos. Atendimentos avulsos sem janela
          registrada contam como 60 min.
        </p>
      </CardContent>
    </Card>
  );
}
