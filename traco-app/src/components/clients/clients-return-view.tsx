'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock4,
  Loader2,
  MessageCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getInitials } from '@/lib/format';
import { isRecentlyContacted } from '@/lib/followups/snapshot';
import type { ClientReturnRow } from '@/lib/queries/clients-followup';
import type { ProcedureRow } from '@/lib/queries/procedures';
import { cn } from '@/lib/utils';
import {
  buildAppointmentVars,
  buildWhatsappUrl,
  renderTemplate,
} from '@/lib/whatsapp';
import { logFollowup, resolveFollowup } from '@/server/actions/followups';

export const DAYS_PRESETS = [15, 21, 30, 40, 60, 90, 180] as const;

type Props = {
  rows: ClientReturnRow[];
  procedures: ProcedureRow[];
  selectedDays: number;
  selectedProcedureId: string | null;
  reminderTemplate: string | null;
  studioName: string | null;
  studioAddress: string | null;
  designerName: string | null;
};

export function ClientsReturnView({
  rows,
  procedures,
  selectedDays,
  selectedProcedureId,
  reminderTemplate,
  studioName,
  studioAddress,
  designerName,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [daysOpen, setDaysOpen] = useState(false);
  const [procOpen, setProcOpen] = useState(false);

  function setDays(days: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('dias', String(days));
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
    setDaysOpen(false);
  }

  function setProcedure(id: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set('procedimento', id);
    else params.delete('procedimento');
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
    setProcOpen(false);
  }

  const selectedProcedure = procedures.find((p) => p.id === selectedProcedureId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FilterField label="Retorno após">
          <Popover open={daysOpen} onOpenChange={setDaysOpen}>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-cream-dark bg-card px-3.5 py-2.5 text-left text-sm transition-colors hover:border-[var(--gold)]/40"
                >
                  <span className="font-medium text-foreground">{selectedDays} dias do atendimento</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </button>
              }
            />
            <PopoverContent align="start" sideOffset={6} className="w-[var(--anchor-width)] min-w-[260px] p-0">
              <ul className="flex flex-col divide-y divide-cream-dark">
                {DAYS_PRESETS.map((d) => (
                  <li key={d}>
                    <button
                      type="button"
                      onClick={() => setDays(d)}
                      className={cn(
                        'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-cream/60',
                        d === selectedDays ? 'font-semibold text-foreground' : 'text-foreground/80',
                      )}
                    >
                      Após {d} dias do atendimento
                      {d === selectedDays ? (
                        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--gold)]">selecionado</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        </FilterField>

        <FilterField label="Procedimento">
          <Popover open={procOpen} onOpenChange={setProcOpen}>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-cream-dark bg-card px-3.5 py-2.5 text-left text-sm transition-colors hover:border-[var(--gold)]/40"
                >
                  <span className="flex items-center gap-2 truncate font-medium text-foreground">
                    {selectedProcedure ? (
                      <>
                        <span
                          aria-hidden
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: selectedProcedure.color }}
                        />
                        <span className="truncate">{selectedProcedure.name}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Todos os procedimentos</span>
                    )}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </button>
              }
            />
            <PopoverContent align="start" sideOffset={6} className="w-[var(--anchor-width)] min-w-[280px] p-0">
              <ul className="flex max-h-72 flex-col divide-y divide-cream-dark overflow-y-auto">
                <li>
                  <button
                    type="button"
                    onClick={() => setProcedure(null)}
                    className={cn(
                      'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-cream/60',
                      !selectedProcedureId ? 'font-semibold text-foreground' : 'text-foreground/80',
                    )}
                  >
                    Todos os procedimentos
                  </button>
                </li>
                {procedures.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setProcedure(p.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-cream/60',
                        p.id === selectedProcedureId
                          ? 'font-semibold text-foreground'
                          : 'text-foreground/80',
                      )}
                    >
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="truncate">{p.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
        </FilterField>
      </div>

      <p className="rounded-md bg-[var(--gold)]/10 px-3.5 py-2.5 text-xs leading-relaxed text-foreground/80 ring-1 ring-[var(--gold)]/30">
        <strong className="text-foreground">Próximas 2 semanas + atrasadas</strong>. Clientes que
        fizeram {selectedProcedure ? selectedProcedure.name : 'qualquer procedimento'} há{' '}
        {selectedDays}+ dias e estão próximas de voltar — perfeito pra contatar antes que esfriem.
      </p>

      {rows.length === 0 ? (
        <EmptyState selectedDays={selectedDays} />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <ReturnRow
              key={r.clientId}
              row={r}
              reminderTemplate={reminderTemplate}
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

function EmptyState({ selectedDays }: { selectedDays: number }) {
  return (
    <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
      <CardContent className="flex flex-col items-center gap-2 text-center">
        <RotateCcw className="size-8 text-muted-foreground/50" strokeWidth={1.25} />
        <p className="font-serif italic text-muted-foreground">
          Nenhuma cliente prevista pra retornar no momento.
        </p>
        <p className="text-xs text-muted-foreground">
          Tente um intervalo maior (atual: {selectedDays} dias) ou outro procedimento.
        </p>
      </CardContent>
    </Card>
  );
}

type RowProps = {
  row: ClientReturnRow;
  reminderTemplate: string | null;
  studioName: string | null;
  studioAddress: string | null;
  designerName: string | null;
};

function ReturnRow({
  row,
  reminderTemplate,
  studioName,
  studioAddress,
  designerName,
}: RowProps) {
  const expectedDate = new Date(`${row.expectedReturnDate}T00:00:00`);
  const lastDate = new Date(row.lastAppointmentDate);
  const [pendingFollowup, startFollowupTransition] = useTransition();

  const recentlyContacted = isRecentlyContacted(row.lastFollowup);

  const status = recentlyContacted
    ? {
        label: 'Contatada',
        tone: 'border-emerald-200 bg-emerald-50/60 ring-emerald-100 opacity-80',
      }
    : row.isOverdue
      ? { label: 'Atrasada', tone: 'border-red-200 bg-red-50/60 ring-red-100' }
      : row.daysUntilReturn === 0
        ? { label: 'Hoje', tone: 'border-amber-300 bg-amber-50/70 ring-amber-200' }
        : row.daysUntilReturn <= 3
          ? { label: 'Esta semana', tone: 'border-amber-300 bg-amber-50/60 ring-amber-200' }
          : { label: 'Próximas 2 semanas', tone: 'border-[var(--gold)]/40 bg-[var(--gold)]/[0.06] ring-[var(--gold)]/30' };

  function handleWhatsapp() {
    if (!reminderTemplate) {
      const fallback = `Oi ${row.fullName.split(' ')[0]}! Está chegando a hora do seu retorno do ${row.lastProcedureName ?? 'procedimento'} 💛 Quer marcar?`;
      const url = buildWhatsappUrl(row.phone, fallback);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const vars = buildAppointmentVars({
        clientFullName: row.fullName,
        procedureName: row.lastProcedureName ?? 'procedimento',
        scheduledStartAt: row.expectedReturnDate + 'T09:00:00',
        price: 0,
        designerName,
        studioName,
        studioAddress,
      });
      const message = renderTemplate(reminderTemplate, vars);
      const url = buildWhatsappUrl(row.phone, message);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    }
    // Registra o follow-up em background — não bloqueia a abertura do WhatsApp
    startFollowupTransition(async () => {
      const result = await logFollowup({ clientId: row.clientId, channel: 'whatsapp' });
      if (!result.success) toast.error(result.error || 'Erro ao registrar follow-up.');
    });
  }

  function handleResolve(outcome: 'scheduled' | 'declined') {
    startFollowupTransition(async () => {
      const result = await resolveFollowup({ clientId: row.clientId, outcome });
      if (result.success) {
        toast.success(
          outcome === 'scheduled' ? 'Cliente marcada como agendou.' : 'Cliente arquivada.',
        );
      } else {
        toast.error(result.error || 'Erro ao salvar.');
      }
    });
  }

  return (
    <li
      className={cn(
        'flex flex-col gap-3 rounded-xl border px-4 py-3.5 ring-1 transition-all',
        status.tone,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/dashboard/clientes/${row.clientId}`}
          className="flex min-w-0 flex-1 items-start gap-3"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cream text-xs font-medium text-[var(--gold)] ring-1 ring-[var(--gold)]/30">
            {getInitials(row.fullName)}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate font-medium text-foreground">{row.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.phone || 'Sem telefone'}</p>
          </div>
        </Link>
        <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-foreground/80 ring-1 ring-cream-dark">
          {status.label}
        </span>
      </div>

      <ul className="flex flex-col gap-1 border-t border-current/10 pt-2.5 text-xs">
        <li className="flex items-center gap-2 text-foreground/80">
          <Calendar className="size-3.5 shrink-0 text-foreground/50" />
          <span>
            <strong className="font-medium">Retorno:</strong>{' '}
            {format(expectedDate, "EEE, dd/MM/yy", { locale: ptBR })}{' '}
            {row.isOverdue ? (
              <span className="text-red-700">— {Math.abs(row.daysUntilReturn)} dias atrasada</span>
            ) : (
              <span className="text-muted-foreground">— faltam {row.daysUntilReturn} dias</span>
            )}
          </span>
        </li>
        <li className="flex items-center gap-2 text-foreground/80">
          <RotateCcw className="size-3.5 shrink-0 text-foreground/50" />
          <span>
            <strong className="font-medium">Último atendimento:</strong>{' '}
            {format(lastDate, "EEE, dd/MM/yy", { locale: ptBR })}
          </span>
        </li>
        <li className="flex items-center gap-2 text-foreground/80">
          <Briefcase className="size-3.5 shrink-0 text-foreground/50" />
          <span>
            <strong className="font-medium">{row.lastProcedureName ?? 'Procedimento'}</strong>{' '}
            ·{' '}
            <span className="text-muted-foreground">
              {row.appointmentsForProcedure}{' '}
              {row.appointmentsForProcedure === 1 ? 'atendimento' : 'atendimentos'}
            </span>
          </span>
        </li>
      </ul>

      {recentlyContacted && row.lastFollowup ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-900">
          <Clock4 className="size-3.5 shrink-0" />
          <span className="flex-1">
            Contatada{' '}
            {format(new Date(row.lastFollowup.contactedAt), "dd/MM 'às' HH:mm", {
              locale: ptBR,
            })}{' '}
            por WhatsApp · aguardando resposta
          </span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {row.phone ? (
          <Button
            type="button"
            variant="premium"
            size="sm"
            onClick={handleWhatsapp}
            disabled={pendingFollowup}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {pendingFollowup ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <MessageCircle className="size-3.5" />
            )}
            {recentlyContacted ? 'Reenviar' : 'Avisar no WhatsApp'}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleResolve('scheduled')}
          disabled={pendingFollowup}
          className="text-emerald-700 hover:bg-emerald-50"
        >
          <CheckCircle2 className="size-3.5" />
          Agendou
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleResolve('declined')}
          disabled={pendingFollowup}
          className="text-muted-foreground hover:bg-cream"
        >
          <XCircle className="size-3.5" />
          Não vai voltar
        </Button>
      </div>
    </li>
  );
}
