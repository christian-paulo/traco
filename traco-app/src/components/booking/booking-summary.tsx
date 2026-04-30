'use client';

import { ChevronUp, Clock, MapPin, Sparkles, Star } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTimeShort } from '@/lib/format';
import type {
  PublicProfessional,
  PublicService,
  PublicStudio,
} from '@/lib/queries/public-booking';
import { cn } from '@/lib/utils';

import type { BookingStep } from './booking-flow';

type Props = {
  studio: PublicStudio;
  professional: PublicProfessional;
  service: PublicService | null;
  scheduledStartIso: string | null;
  step: BookingStep;
  onContinue: () => void;
  continueDisabled: boolean;
  continueHidden: boolean;
};

export function BookingSummary({
  studio,
  professional,
  service,
  scheduledStartIso,
  step,
  onContinue,
  continueDisabled,
  continueHidden,
}: Props) {
  const [openMobile, setOpenMobile] = useState(false);
  const total = service ? Number(service.custom_price ?? service.procedure.default_price) : 0;
  const continueLabel =
    step === 'services'
      ? 'Continuar'
      : step === 'professional'
        ? 'Continuar'
        : step === 'datetime'
          ? 'Confirmar horário'
          : 'Continuar';

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden flex-col gap-4 lg:flex lg:w-96 lg:shrink-0">
        <div className="sticky top-4 flex flex-col gap-4 rounded-xl border border-cream-dark bg-card p-5 shadow-sm">
          <StudioHeader studio={studio} />
          <Divider />
          <SummaryBody
            studio={studio}
            professional={professional}
            service={service}
            scheduledStartIso={scheduledStartIso}
          />
          <Divider />
          <Total amount={total} hasService={Boolean(service)} />
          {!continueHidden ? (
            <Button
              variant="premium"
              size="xl"
              className="w-full"
              onClick={onContinue}
              disabled={continueDisabled}
            >
              {continueLabel}
            </Button>
          ) : null}
        </div>
      </aside>

      {/* Mobile bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-30 lg:hidden">
        <div
          className={cn(
            'border-t border-cream-dark bg-card shadow-[0_-8px_24px_rgba(10,10,10,0.08)] transition-transform',
          )}
        >
          <button
            type="button"
            onClick={() => setOpenMobile((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3"
            aria-expanded={openMobile}
          >
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {service ? '1 serviço selecionado' : 'Nenhum serviço selecionado'}
              </span>
              <span className="font-serif text-base font-medium text-foreground">
                {service ? formatCurrency(total) : '—'}
              </span>
            </div>
            <ChevronUp
              className={cn(
                'size-5 text-muted-foreground transition-transform',
                openMobile && 'rotate-180',
              )}
            />
          </button>

          {openMobile ? (
            <div className="max-h-[60vh] overflow-y-auto border-t border-cream-dark px-4 py-4">
              <div className="flex flex-col gap-3">
                <StudioHeader studio={studio} />
                <Divider />
                <SummaryBody
                  studio={studio}
                  professional={professional}
                  service={service}
                  scheduledStartIso={scheduledStartIso}
                />
                <Divider />
                <Total amount={total} hasService={Boolean(service)} />
              </div>
            </div>
          ) : null}

          {!continueHidden ? (
            <div className="border-t border-cream-dark bg-cream/40 px-4 py-3">
              <Button
                variant="premium"
                size="xl"
                className="w-full"
                onClick={onContinue}
                disabled={continueDisabled}
              >
                {continueLabel}
              </Button>
            </div>
          ) : null}
        </div>

        {/* Spacer to avoid content being hidden behind sheet */}
        <div className="h-24" />
      </div>
    </>
  );
}

function StudioHeader({ studio }: { studio: PublicStudio }) {
  return (
    <div className="flex items-start gap-3">
      <div className="bg-cream-dark relative size-14 shrink-0 overflow-hidden rounded-md">
        {studio.cover_image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={studio.cover_image_url}
            alt={studio.name}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-[var(--gold)]/15 text-lg font-medium text-[var(--gold)]">
            {studio.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-serif text-lg font-medium leading-tight text-foreground">
          {studio.name}
        </p>
        {studio.rating > 0 ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3 fill-[var(--gold)] text-[var(--gold)]" />
            <span className="font-medium text-foreground">{studio.rating.toFixed(1)}</span>
            {studio.reviews_count > 0 ? <span>· {studio.reviews_count} avaliações</span> : null}
          </p>
        ) : null}
        {studio.address ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            {studio.address}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SummaryBody({
  service,
  professional,
  scheduledStartIso,
}: {
  studio: PublicStudio;
  professional: PublicProfessional;
  service: PublicService | null;
  scheduledStartIso: string | null;
}) {
  if (!service) {
    return (
      <p className="font-serif text-sm italic text-muted-foreground">
        Selecione um serviço para começar.
      </p>
    );
  }
  const price = Number(service.custom_price ?? service.procedure.default_price);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="flex items-center gap-1.5 font-serif text-base font-medium text-foreground">
            <Sparkles className="size-3.5 text-[var(--gold)]" />
            {service.procedure.name}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {service.duration_minutes} min · com {professional.display_name}
          </p>
        </div>
        <span className="font-serif text-base font-medium text-foreground">
          {formatCurrency(price)}
        </span>
      </div>

      {scheduledStartIso ? (
        <div className="rounded-md border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-3 py-2 text-xs">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Horário escolhido
          </p>
          <p className="font-serif text-sm font-medium text-foreground">
            {formatDateTimeShort(scheduledStartIso)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Total({ amount, hasService }: { amount: number; hasService: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</span>
      <span className="font-serif text-2xl font-medium text-foreground">
        {hasService ? formatCurrency(amount) : '—'}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-cream-dark" />;
}
