'use client';

import { Check } from 'lucide-react';

import type { OnboardingStep } from '@/lib/onboarding/steps';
import { cn } from '@/lib/utils';

type StepDef = {
  key: OnboardingStep;
  label: string;
  hint: string;
};

const STEPS: StepDef[] = [
  { key: 'you', label: 'Você', hint: 'Foto, nome e WhatsApp' },
  { key: 'studio', label: 'Studio', hint: 'Nome, endereço, capa' },
  { key: 'procedures', label: 'Procedimentos', hint: 'O que você oferece' },
  { key: 'hours', label: 'Horários', hint: 'Quando você atende' },
  { key: 'messages', label: 'Mensagens', hint: 'Templates de WhatsApp' },
];

type Props = {
  currentStep: OnboardingStep;
};

export function WizardStepper({ currentStep }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <>
      {/* Mobile: barra horizontal compacta */}
      <div className="border-b border-cream-dark bg-foreground px-4 py-4 md:hidden">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.18em] text-background/70">
              <span>
                Passo {currentIndex + 1} de {STEPS.length}
              </span>
              <span className="text-[var(--gold)]">{STEPS[currentIndex]?.label}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-background/10">
              <div
                className="h-full rounded-full bg-[var(--gold)] transition-all duration-500"
                style={{
                  width: `${((currentIndex + 1) / STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: sidebar vertical */}
      <aside className="hidden w-72 shrink-0 flex-col gap-8 bg-foreground p-8 text-background md:flex">
        <Logo />
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-background/50">
            Bem-vinda ao
          </p>
          <p className="font-serif text-3xl font-medium tracking-tight">Traço</p>
        </div>

        <ol className="flex flex-col gap-1">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentIndex;
            const isCurrent = step.key === currentStep;
            return (
              <li key={step.key} className="relative">
                {idx < STEPS.length - 1 ? (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute left-[15px] top-[34px] h-[calc(100%-26px)] w-px',
                      isDone ? 'bg-[var(--gold)]/60' : 'bg-background/15',
                    )}
                  />
                ) : null}
                <div className="flex items-start gap-3 py-2">
                  <span
                    className={cn(
                      'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium transition-all',
                      isDone
                        ? 'border-[var(--gold)] bg-[var(--gold)] text-foreground'
                        : isCurrent
                          ? 'border-[var(--gold)] bg-foreground text-[var(--gold)]'
                          : 'border-background/20 bg-foreground text-background/40',
                    )}
                  >
                    {isDone ? <Check className="size-4" strokeWidth={3} /> : idx + 1}
                  </span>
                  <div className="flex flex-col gap-0.5 pt-1">
                    <p
                      className={cn(
                        'font-serif text-base font-medium leading-tight transition-colors',
                        isCurrent
                          ? 'text-[var(--gold)]'
                          : isDone
                            ? 'text-background'
                            : 'text-background/60',
                      )}
                    >
                      {step.label}
                    </p>
                    <p
                      className={cn(
                        'text-xs transition-colors',
                        isCurrent ? 'text-background/70' : 'text-background/40',
                      )}
                    >
                      {step.hint}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-auto text-[11px] leading-relaxed text-background/40">
          Suas respostas configuram o sistema pra sua rotina. Você pode editar
          tudo depois em Configurações.
        </p>
      </aside>
    </>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="size-1 rounded-full bg-[var(--gold)]" />
      <span className="font-serif text-2xl font-medium tracking-tight text-background">
        Traço
      </span>
    </div>
  );
}

export { STEPS as ONBOARDING_STEP_DEFS };
