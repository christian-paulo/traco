'use client';

import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import type { OnboardingStep } from '@/lib/onboarding/steps';
import { cn } from '@/lib/utils';
import { goBackOnboardingStep } from '@/server/actions/onboarding';

type Props = {
  title: string;
  subtitle: string;
  description?: string;
  step: OnboardingStep;
  onContinue: () => void;
  continueDisabled?: boolean;
  continuePending?: boolean;
  continueLabel?: string;
  children: React.ReactNode;
  className?: string;
};

export function StepShell({
  title,
  subtitle,
  description,
  step,
  onContinue,
  continueDisabled,
  continuePending,
  continueLabel,
  children,
  className,
}: Props) {
  const [backPending, startBackTransition] = useTransition();
  const isFirstStep = step === 'you';

  function handleBack() {
    if (isFirstStep) return;
    startBackTransition(async () => {
      const result = await goBackOnboardingStep(step);
      if (!result.success) toast.error(result.error || 'Erro ao voltar.');
    });
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <header className="flex flex-col gap-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--gold)]">
            {subtitle}
          </p>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </header>

        <div className="flex flex-col gap-6">{children}</div>

        <div className="flex items-center justify-between gap-3 border-t border-cream-dark pt-6">
          {!isFirstStep ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={backPending || continuePending}
            >
              {backPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowLeft className="size-4" />
              )}
              Voltar
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            variant="premium"
            size="xl"
            onClick={onContinue}
            disabled={continueDisabled || continuePending}
          >
            {continuePending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
            {continueLabel ?? 'Próximo passo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
