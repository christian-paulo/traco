'use client';

import { Check, Circle, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'traco:onboarding-dismissed';

export type OnboardingStatus = {
  hasClient: boolean;
  hasProfilePhone: boolean;
  hasCustomProcedure: boolean;
  hasAppointment: boolean;
  hasFicha: boolean;
};

type Step = {
  key: keyof OnboardingStatus;
  label: string;
  href: string;
};

const STEPS: Step[] = [
  { key: 'hasClient', label: 'Cadastrar primeira cliente', href: '/dashboard/clientes' },
  {
    key: 'hasProfilePhone',
    label: 'Configurar perfil (nome + WhatsApp)',
    href: '/dashboard/configuracoes',
  },
  {
    key: 'hasCustomProcedure',
    label: 'Personalizar procedimentos',
    href: '/dashboard/configuracoes',
  },
  {
    key: 'hasAppointment',
    label: 'Registrar primeiro atendimento',
    href: '/dashboard/atendimentos',
  },
  { key: 'hasFicha', label: 'Enviar primeira ficha', href: '/dashboard/clientes' },
];

type Props = {
  status: OnboardingStatus;
};

export function OnboardingChecklist({ status }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(window.localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  const completed = STEPS.filter((s) => status[s.key]).length;
  const allDone = completed === STEPS.length;

  useEffect(() => {
    if (allDone) {
      window.localStorage.setItem(STORAGE_KEY, '1');
    }
  }, [allDone]);

  if (!mounted || dismissed || allDone) return null;

  return (
    <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--gold)]/30 py-5">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-6 pb-3">
        <div className="flex flex-col gap-1">
          <div className="h-px w-6 bg-[var(--gold)]" />
          <CardTitle className="font-serif text-xl font-medium">Vamos começar</CardTitle>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {completed} de {STEPS.length} concluídos
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Dispensar checklist"
          onClick={() => {
            window.localStorage.setItem(STORAGE_KEY, '1');
            setDismissed(true);
          }}
          className="size-8"
        >
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-3">
        {STEPS.map((step) => {
          const done = status[step.key];
          return (
            <Link
              key={step.key}
              href={step.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                'hover:bg-cream/60',
                done && 'opacity-60',
              )}
            >
              {done ? (
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="size-3" />
                </span>
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground/40" strokeWidth={1.5} />
              )}
              <span className={cn('flex-1', done && 'line-through')}>{step.label}</span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
