'use client';

import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { PublicBookingPayload } from '@/lib/queries/public-booking';
import { cn } from '@/lib/utils';

import { BookingSummary } from './booking-summary';
import { StepConfirmation } from './step-confirmation';
import { StepDateTime } from './step-datetime';
import { StepDetails } from './step-details';
import { StepProfessional } from './step-professional';
import { StepServices } from './step-services';

export type BookingStep = 'services' | 'professional' | 'datetime' | 'details' | 'confirmation';

export type BookingDetailsForm = {
  full_name: string;
  phone: string;
  email: string;
  birth_date: string;
  notes: string;
  referral_source: string;
  consent: boolean;
};

type Props = {
  payload: PublicBookingPayload;
};

export function BookingFlow({ payload }: Props) {
  const [step, setStep] = useState<BookingStep>('services');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
  const [details, setDetails] = useState<BookingDetailsForm>({
    full_name: '',
    phone: '',
    email: '',
    birth_date: '',
    notes: '',
    referral_source: '',
    consent: false,
  });
  const [confirmedData, setConfirmedData] = useState<{
    scheduledFormatted: string;
    scheduledIso: string;
    procedureName: string;
    finalPrice: number;
  } | null>(null);

  const selectedService = useMemo(
    () => payload.services.find((s) => s.id === selectedServiceId) ?? null,
    [payload.services, selectedServiceId],
  );

  function goPrev() {
    if (step === 'professional') return setStep('services');
    if (step === 'datetime') return setStep(payload.studio.is_solo ? 'services' : 'professional');
    if (step === 'details') return setStep('datetime');
    if (step === 'services') return; // não há anterior
    if (step === 'confirmation') return; // confirmação é terminal
  }

  function advanceFromServices() {
    if (!selectedService) return;
    if (payload.studio.is_solo) {
      setStep('datetime');
    } else {
      setStep('professional');
    }
  }

  function advanceFromProfessional() {
    setStep('datetime');
  }

  function advanceFromDatetime() {
    if (!selectedDateTime) return;
    setStep('details');
  }

  function handleConfirmed(payloadConfirmed: {
    scheduledFormatted: string;
    scheduledIso: string;
    procedureName: string;
    finalPrice: number;
  }) {
    setConfirmedData(payloadConfirmed);
    setStep('confirmation');
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8">
      <section className="flex flex-1 flex-col">
        {step !== 'services' && step !== 'confirmation' ? (
          <button
            type="button"
            onClick={goPrev}
            className="mb-3 inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground hover:text-[var(--gold)]"
          >
            <ArrowLeft className="size-3.5" />
            Voltar
          </button>
        ) : null}

        <Breadcrumb step={step} isSolo={payload.studio.is_solo} />

        <div className={cn('mt-4 flex flex-col gap-6', step === 'confirmation' && 'mt-0')}>
          {step === 'services' ? (
            <StepServices
              studio={payload.studio}
              services={payload.services}
              selectedServiceId={selectedServiceId}
              onToggleService={(id) =>
                setSelectedServiceId((prev) => (prev === id ? null : id))
              }
              onAdvance={advanceFromServices}
            />
          ) : null}

          {step === 'professional' ? (
            <StepProfessional
              professional={payload.professional}
              onAdvance={advanceFromProfessional}
            />
          ) : null}

          {step === 'datetime' && selectedService ? (
            <StepDateTime
              slug={payload.studio.slug}
              service={selectedService}
              waitlistEnabled={payload.studio.waitlist_enabled}
              selectedDateTime={selectedDateTime}
              onSelectDateTime={setSelectedDateTime}
              onAdvance={advanceFromDatetime}
              clientName={details.full_name}
            />
          ) : null}

          {step === 'details' && selectedService && selectedDateTime ? (
            <StepDetails
              slug={payload.studio.slug}
              service={selectedService}
              scheduledStartIso={selectedDateTime}
              details={details}
              onChange={setDetails}
              onConfirmed={handleConfirmed}
            />
          ) : null}

          {step === 'confirmation' && confirmedData ? (
            <StepConfirmation
              studio={payload.studio}
              designer={payload.designer}
              confirmed={confirmedData}
            />
          ) : null}
        </div>
      </section>

      {step !== 'confirmation' ? (
        <BookingSummary
          studio={payload.studio}
          professional={payload.professional}
          service={selectedService}
          scheduledStartIso={selectedDateTime}
          step={step}
          onContinue={() => {
            if (step === 'services') advanceFromServices();
            else if (step === 'professional') advanceFromProfessional();
            else if (step === 'datetime') advanceFromDatetime();
          }}
          continueDisabled={
            (step === 'services' && !selectedService) ||
            (step === 'datetime' && !selectedDateTime)
          }
          continueHidden={step === 'details'}
        />
      ) : null}
    </div>
  );
}

function Breadcrumb({ step, isSolo }: { step: BookingStep; isSolo: boolean }) {
  const labels: Array<{ key: BookingStep; label: string }> = [
    { key: 'services', label: 'Serviços' },
    ...(!isSolo ? [{ key: 'professional', label: 'Profissional' } as const] : []),
    { key: 'datetime', label: 'Horário' },
    { key: 'details', label: 'Detalhes' },
  ];
  const currentIdx = labels.findIndex((l) => l.key === step);
  if (step === 'confirmation' || currentIdx === -1) return null;

  return (
    <nav
      aria-label="Etapas"
      className="flex flex-wrap items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em]"
    >
      {labels.map((l, idx) => (
        <span key={l.key} className="flex items-center gap-1.5">
          <span
            className={cn(
              idx === currentIdx
                ? 'text-foreground'
                : idx < currentIdx
                  ? 'text-[var(--gold)]'
                  : 'text-muted-foreground/60',
            )}
          >
            {l.label}
          </span>
          {idx < labels.length - 1 ? (
            <span className="text-muted-foreground/40">·</span>
          ) : null}
        </span>
      ))}
    </nav>
  );
}
