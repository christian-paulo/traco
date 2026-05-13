import { Briefcase, Calendar, Clock, MessageCircle, Users } from 'lucide-react';
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
  followupsContacted: number;
  followupsScheduled: number;
  conversionRate: number;
  shareHref: string;
};

type RowTone = {
  iconBg: string;
  iconColor: string;
  valueColor: string;
  cardBg: string;
  cardRing: string;
};

const TONE_GOLD: RowTone = {
  iconBg: 'bg-[var(--gold)]/15',
  iconColor: 'text-[var(--gold)]',
  valueColor: 'text-foreground',
  cardBg: 'bg-[var(--gold)]/[0.06]',
  cardRing: 'ring-[var(--gold)]/25',
};

const TONE_INK: RowTone = {
  iconBg: 'bg-foreground/10',
  iconColor: 'text-foreground',
  valueColor: 'text-foreground',
  cardBg: 'bg-cream-dark/40',
  cardRing: 'ring-foreground/10',
};

const TONE_EMERALD: RowTone = {
  iconBg: 'bg-emerald-100',
  iconColor: 'text-emerald-700',
  valueColor: 'text-foreground',
  cardBg: 'bg-emerald-50/60',
  cardRing: 'ring-emerald-200',
};

const TONE_AMBER: RowTone = {
  iconBg: 'bg-[var(--gold-light)]/50',
  iconColor: 'text-[var(--gold-dark)]',
  valueColor: 'text-foreground',
  cardBg: 'bg-[var(--gold-light)]/15',
  cardRing: 'ring-[var(--gold-light)]/60',
};

const TONE_GREEN: RowTone = {
  iconBg: 'bg-emerald-100',
  iconColor: 'text-emerald-700',
  valueColor: 'text-foreground',
  cardBg: 'bg-emerald-50/50',
  cardRing: 'ring-emerald-200',
};

export function EffortCard({
  daysWithAppointments,
  appointmentsCount,
  uniqueClients,
  totalMinutes,
  followupsContacted,
  followupsScheduled,
  conversionRate,
  shareHref,
}: Props) {
  const conversionLabel =
    followupsContacted > 0
      ? `${Math.round(conversionRate * 100)}% conversão · ${followupsScheduled} agendaram`
      : 'nenhum contato neste período';

  const rows = [
    {
      icon: Calendar,
      value: daysWithAppointments,
      suffix: daysWithAppointments === 1 ? 'dia' : 'dias',
      label: 'com atendimento',
      tone: TONE_GOLD,
    },
    {
      icon: Briefcase,
      value: appointmentsCount,
      suffix: appointmentsCount === 1 ? 'atendimento' : 'atendimentos',
      label: 'realizados',
      tone: TONE_INK,
    },
    {
      icon: Users,
      value: uniqueClients,
      suffix: uniqueClients === 1 ? 'cliente' : 'clientes',
      label: 'únicas atendidas',
      tone: TONE_EMERALD,
    },
    {
      icon: Clock,
      value: formatMinutesAsHours(totalMinutes),
      suffix: 'horas',
      label: 'atendidas',
      tone: TONE_AMBER,
    },
    {
      icon: MessageCircle,
      value: followupsContacted,
      suffix: followupsContacted === 1 ? 'cliente' : 'clientes',
      label: conversionLabel,
      tone: TONE_GREEN,
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
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 ring-1 transition-colors',
                r.tone.cardBg,
                r.tone.cardRing,
              )}
            >
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full',
                  r.tone.iconBg,
                  r.tone.iconColor,
                )}
              >
                <r.icon className="size-4" strokeWidth={1.75} />
              </div>
              <div className="flex flex-1 items-baseline gap-2">
                <span
                  className={cn(
                    'text-xl font-semibold tabular-nums sm:text-2xl',
                    r.tone.valueColor,
                  )}
                >
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
