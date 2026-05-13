'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { StepShell } from '@/components/onboarding/step-shell';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { advanceOnboardingStep } from '@/server/actions/onboarding';
import { replaceWorkingHours } from '@/server/actions/studio';

type HourRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

type Props = {
  initial: HourRow[];
};

// Postgres retorna time como "HH:MM:SS"; o input/schema espera "HH:MM"
function trimTime(t: string): string {
  return t.length > 5 ? t.slice(0, 5) : t;
}

function normalizeInitial(initial: HourRow[]): HourRow[] {
  const byDay = new Map(initial.map((h) => [h.day_of_week, h]));
  return Array.from({ length: 7 }, (_, day) => {
    const found = byDay.get(day);
    if (found) {
      return {
        day_of_week: day,
        start_time: trimTime(found.start_time),
        end_time: trimTime(found.end_time),
        is_active: found.is_active,
      };
    }
    return {
      day_of_week: day,
      start_time: '09:00',
      end_time: '18:00',
      is_active: day >= 1 && day <= 5,
    };
  });
}

export function StepHours({ initial }: Props) {
  const [hours, setHours] = useState<HourRow[]>(() => normalizeInitial(initial));
  const [pending, startTransition] = useTransition();

  const activeCount = hours.filter((h) => h.is_active).length;
  const isValid = activeCount >= 1;

  function toggle(day: number) {
    setHours((prev) =>
      prev.map((h) => (h.day_of_week === day ? { ...h, is_active: !h.is_active } : h)),
    );
  }

  function updateTime(day: number, field: 'start_time' | 'end_time', value: string) {
    setHours((prev) =>
      prev.map((h) => (h.day_of_week === day ? { ...h, [field]: value } : h)),
    );
  }

  function handleContinue() {
    if (!isValid) return;
    startTransition(async () => {
      const result = await replaceWorkingHours(hours);
      if (!result.success) {
        toast.error(result.error || 'Erro ao salvar.');
        return;
      }
      const advanced = await advanceOnboardingStep('hours');
      if (!advanced.success) toast.error(advanced.error || 'Erro ao avançar.');
    });
  }

  return (
    <StepShell
      step="hours"
      subtitle="Passo 4 de 5"
      title="Quando você atende?"
      description="Define a disponibilidade da sua página pública de agendamento. Editáve a qualquer momento em Configurações."
      onContinue={handleContinue}
      continueDisabled={!isValid}
      continuePending={pending}
    >
      <div className="flex flex-col gap-2">
        {hours.map((h) => {
          const isActive = h.is_active;
          return (
            <div
              key={h.day_of_week}
              className={cn(
                'flex flex-col gap-3 rounded-lg border px-4 py-3 transition-all sm:flex-row sm:items-center',
                isActive
                  ? 'border-[var(--gold)]/30 bg-card'
                  : 'border-cream-dark bg-cream/30',
              )}
            >
              <button
                type="button"
                onClick={() => toggle(h.day_of_week)}
                className="flex items-center gap-3 text-left sm:w-32"
              >
                <span
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
                    isActive ? 'bg-[var(--gold)]' : 'bg-muted',
                  )}
                  aria-hidden
                >
                  <span
                    className={cn(
                      'absolute top-0.5 size-4 rounded-full bg-background shadow transition-all',
                      isActive ? 'left-[18px]' : 'left-0.5',
                    )}
                  />
                </span>
                <span
                  className={cn(
                    'font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {DAY_LABELS[h.day_of_week]}
                </span>
              </button>

              {isActive ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    type="time"
                    value={h.start_time}
                    onChange={(e) => updateTime(h.day_of_week, 'start_time', e.target.value)}
                    className="h-9 flex-1"
                    disabled={pending}
                  />
                  <span className="text-xs text-muted-foreground">até</span>
                  <Input
                    type="time"
                    value={h.end_time}
                    onChange={(e) => updateTime(h.day_of_week, 'end_time', e.target.value)}
                    className="h-9 flex-1"
                    disabled={pending}
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground sm:flex-1">Folga</p>
              )}
            </div>
          );
        })}
      </div>

      {!isValid ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          Ative ao menos 1 dia da semana.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Você atende {activeCount} {activeCount === 1 ? 'dia' : 'dias'} na semana.
        </p>
      )}
    </StepShell>
  );
}
