'use client';

import { CalendarPlus, Check, Home, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTimeShort } from '@/lib/format';
import type { PublicStudio } from '@/lib/queries/public-booking';
import { digitsOnly } from '@/lib/utils/phone';

type Props = {
  studio: PublicStudio;
  designer: { full_name: string; phone: string | null };
  confirmed: {
    scheduledFormatted: string;
    scheduledIso: string;
    procedureName: string;
    finalPrice: number;
  };
};

function buildIcsContent(args: {
  procedureName: string;
  studioName: string;
  studioAddress: string | null;
  startIso: string;
  durationHours?: number;
}): string {
  const start = new Date(args.startIso);
  const end = new Date(start.getTime() + (args.durationHours ?? 1) * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
      d.getUTCDate(),
    ).padStart(2, '0')}T${String(d.getUTCHours()).padStart(2, '0')}${String(
      d.getUTCMinutes(),
    ).padStart(2, '0')}00Z`;
  const uid = `${Date.now()}@traco.app`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Traço//Booking//PT-BR',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${args.procedureName} — ${args.studioName}`,
    args.studioAddress ? `LOCATION:${args.studioAddress}` : '',
    'STATUS:TENTATIVE',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

export function StepConfirmation({ studio, designer, confirmed }: Props) {
  function handleAddToCalendar() {
    const ics = buildIcsContent({
      procedureName: confirmed.procedureName,
      studioName: studio.name,
      studioAddress: studio.address,
      startIso: confirmed.scheduledIso,
    });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agendamento-traco.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const whatsappDigits = designer.phone ? digitsOnly(designer.phone) : '';
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits.startsWith('55') ? whatsappDigits : `55${whatsappDigits}`}`
    : null;

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100">
        <Check className="size-10 text-emerald-600" strokeWidth={2} />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Agendamento solicitado!
        </h1>
        <p className="font-serif text-base italic text-muted-foreground">
          {designer.full_name} vai confirmar em breve.
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-3 rounded-xl border border-cream-dark bg-card p-5 text-left shadow-sm">
        <Detail label="Studio" value={studio.name} />
        {studio.address ? <Detail label="Endereço" value={studio.address} /> : null}
        <Detail label="Procedimento" value={confirmed.procedureName} />
        <Detail label="Data e horário" value={formatDateTimeShort(confirmed.scheduledIso)} />
        <Detail label="Total" value={formatCurrency(confirmed.finalPrice)} />
      </div>

      <ol className="w-full max-w-md flex flex-col gap-2 text-left text-sm">
        <Step n={1}>
          Você receberá um email de confirmação assim que {designer.full_name} aprovar.
        </Step>
        <Step n={2}>
          Antes do procedimento, você receberá uma ficha de anamnese pra preencher.
        </Step>
        <Step n={3}>Vai receber lembrete por WhatsApp 24h antes do horário.</Step>
      </ol>

      <div className="flex w-full max-w-md flex-col items-center gap-2">
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Button
            variant="premium"
            size="xl"
            onClick={handleAddToCalendar}
            className="flex-1"
          >
            <CalendarPlus className="size-4" />
            Adicionar ao calendário
          </Button>
        </div>
        <a
          href={`/agendar/${studio.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground hover:text-[var(--gold)]"
        >
          <Home className="size-3.5" />
          Voltar pra página inicial
        </a>
        {whatsappUrl ? (
          <p className="text-xs text-muted-foreground">
            Precisa cancelar?{' '}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[var(--gold)] hover:underline"
            >
              <MessageCircle className="size-3" />
              WhatsApp da designer
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/15 text-xs font-medium text-[var(--gold)]">
        {n}
      </span>
      <span className="text-foreground/85">{children}</span>
    </li>
  );
}
