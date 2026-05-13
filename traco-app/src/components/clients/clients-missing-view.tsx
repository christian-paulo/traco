'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Briefcase, Calendar, ChevronDown, GhostIcon, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { getInitials } from '@/lib/format';
import type { MissingClientRow } from '@/lib/queries/clients-followup';
import { cn } from '@/lib/utils';
import {
  buildAppointmentVars,
  buildWhatsappUrl,
  renderTemplate,
} from '@/lib/whatsapp';
import { logFollowup } from '@/server/actions/followups';

export const DAYS_OPTIONS = [30, 45, 60, 90, 120, 180, 365] as const;
export const MIN_APPTS_OPTIONS = [1, 2, 3, 5, 10] as const;

type Props = {
  rows: MissingClientRow[];
  selectedDays: number;
  selectedMinAppointments: number;
  recoveryTemplate: string | null;
  studioName: string | null;
  studioAddress: string | null;
  designerName: string | null;
};

export function ClientsMissingView({
  rows,
  selectedDays,
  selectedMinAppointments,
  recoveryTemplate,
  studioName,
  studioAddress,
  designerName,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [daysOpen, setDaysOpen] = useState(false);
  const [minOpen, setMinOpen] = useState(false);

  function setDays(d: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('dias', String(d));
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
    setDaysOpen(false);
  }

  function setMinAppts(n: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('min', String(n));
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
    setMinOpen(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FilterField label="Último atendimento a">
          <Popover open={daysOpen} onOpenChange={setDaysOpen}>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-cream-dark bg-card px-3.5 py-2.5 text-left text-sm transition-colors hover:border-[var(--gold)]/40"
                >
                  <span className="font-medium text-foreground">{selectedDays} dias ou mais</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </button>
              }
            />
            <PopoverContent align="start" sideOffset={6} className="w-[var(--anchor-width)] min-w-[240px] p-0">
              <ul className="flex flex-col divide-y divide-cream-dark">
                {DAYS_OPTIONS.map((d) => (
                  <li key={d}>
                    <button
                      type="button"
                      onClick={() => setDays(d)}
                      className={cn(
                        'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-cream/60',
                        d === selectedDays ? 'font-semibold text-foreground' : 'text-foreground/80',
                      )}
                    >
                      {d} dias ou mais
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        </FilterField>

        <FilterField label="Com pelo menos">
          <Popover open={minOpen} onOpenChange={setMinOpen}>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-cream-dark bg-card px-3.5 py-2.5 text-left text-sm transition-colors hover:border-[var(--gold)]/40"
                >
                  <span className="font-medium text-foreground">
                    {selectedMinAppointments}{' '}
                    {selectedMinAppointments === 1 ? 'atendimento' : 'atendimentos'}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </button>
              }
            />
            <PopoverContent align="start" sideOffset={6} className="w-[var(--anchor-width)] min-w-[200px] p-0">
              <ul className="flex flex-col divide-y divide-cream-dark">
                {MIN_APPTS_OPTIONS.map((n) => (
                  <li key={n}>
                    <button
                      type="button"
                      onClick={() => setMinAppts(n)}
                      className={cn(
                        'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-cream/60',
                        n === selectedMinAppointments
                          ? 'font-semibold text-foreground'
                          : 'text-foreground/80',
                      )}
                    >
                      {n} {n === 1 ? 'atendimento' : 'atendimentos'}
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        </FilterField>
      </div>

      <p className="rounded-md bg-amber-50/60 px-3.5 py-2.5 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
        Clientes que não voltam há <strong>{selectedDays}+ dias</strong> e tiveram pelo menos{' '}
        <strong>{selectedMinAppointments} atendimento{selectedMinAppointments > 1 ? 's' : ''}</strong>{' '}
        no histórico. São candidatas a reativação — vale tentar uma mensagem.
      </p>

      {rows.length === 0 ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
          <CardContent className="flex flex-col items-center gap-2 text-center">
            <GhostIcon className="size-8 text-muted-foreground/50" strokeWidth={1.25} />
            <p className="font-serif italic text-muted-foreground">
              Nenhuma cliente sumida com esses filtros.
            </p>
            <p className="text-xs text-muted-foreground">
              Boa notícia — a fidelização tá em dia.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <MissingRow
              key={r.clientId}
              row={r}
              recoveryTemplate={recoveryTemplate}
              studioName={studioName}
              studioAddress={studioAddress}
              designerName={designerName}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function MissingRow({
  row,
  recoveryTemplate,
  studioName,
  studioAddress,
  designerName,
}: {
  row: MissingClientRow;
  recoveryTemplate: string | null;
  studioName: string | null;
  studioAddress: string | null;
  designerName: string | null;
}) {
  function handleWhatsapp() {
    const firstName = row.fullName.split(' ')[0];
    const fallback = `Oi ${firstName}! Faz ${row.daysSinceLast} dias que não nos vemos por aqui 💛 Que tal agendar seu próximo cuidado?`;
    if (!recoveryTemplate) {
      const url = buildWhatsappUrl(row.phone, fallback);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const vars = buildAppointmentVars({
        clientFullName: row.fullName,
        procedureName: 'procedimento',
        scheduledStartAt: new Date().toISOString(),
        price: 0,
        designerName,
        studioName,
        studioAddress,
      });
      const message = renderTemplate(recoveryTemplate, {
        ...vars,
        dias: String(row.daysSinceLast),
      });
      const url = buildWhatsappUrl(row.phone, message);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    }
    // Registra follow-up em background (fire-and-forget)
    void logFollowup({ clientId: row.clientId, channel: 'whatsapp' });
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-cream-dark bg-card px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
      <Link
        href={`/dashboard/clientes/${row.clientId}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream text-[11px] font-medium text-[var(--gold)] ring-1 ring-[var(--gold)]/30">
          {getInitials(row.fullName)}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate font-medium text-foreground">{row.fullName}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" />
              {format(new Date(row.lastAppointmentDate), 'dd/MM/yy', { locale: ptBR })}
              <span className="text-foreground/60"> · há {row.daysSinceLast} dias</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="size-3" />
              {row.appointmentsCount}{' '}
              {row.appointmentsCount === 1 ? 'atendimento' : 'atendimentos'}
            </span>
          </div>
        </div>
      </Link>
      {row.phone ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleWhatsapp}
          className="shrink-0 border-emerald-500/40 text-emerald-700 hover:bg-emerald-50"
        >
          <MessageCircle className="size-3.5" />
          WhatsApp
        </Button>
      ) : null}
    </li>
  );
}
