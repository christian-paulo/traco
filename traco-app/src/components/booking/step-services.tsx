'use client';

import { Check, Clock, Plus } from 'lucide-react';

import { formatCurrency } from '@/lib/format';
import type { PublicService, PublicStudio } from '@/lib/queries/public-booking';
import { cn } from '@/lib/utils';

type Props = {
  studio: PublicStudio;
  services: PublicService[];
  selectedServiceId: string | null;
  onToggleService: (id: string) => void;
  onAdvance: () => void;
};

export function StepServices({ studio, services, selectedServiceId, onToggleService }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Serviços
        </h1>
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          {studio.name}
        </p>
        {studio.bio ? (
          <p className="mt-2 max-w-2xl font-serif text-sm italic text-muted-foreground">
            {studio.bio}
          </p>
        ) : null}
      </div>

      {services.length === 0 ? (
        <div className="rounded-xl border border-cream-dark bg-card p-8 text-center">
          <p className="font-serif text-lg italic text-muted-foreground">
            Esta profissional ainda não tem serviços disponíveis para agendamento online.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {services.map((s) => {
            const isSelected = selectedServiceId === s.id;
            const price = Number(s.custom_price ?? s.procedure.default_price);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onToggleService(s.id)}
                  className={cn(
                    'group/service flex w-full items-start justify-between gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md sm:p-5',
                    isSelected
                      ? 'border-[var(--gold)] ring-2 ring-[var(--gold)]/30'
                      : 'border-cream-dark hover:border-[var(--gold)]/50',
                  )}
                  aria-pressed={isSelected}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.procedure.color }}
                        aria-hidden
                      />
                      <p className="font-serif text-lg font-medium text-foreground sm:text-xl">
                        {s.procedure.name}
                      </p>
                    </div>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {s.duration_minutes} min
                      </span>
                      {s.procedure.default_return_days > 0 ? (
                        <span>· retorno em {s.procedure.default_return_days} dias</span>
                      ) : null}
                    </p>
                    <p className="font-serif text-base font-medium text-foreground">
                      {formatCurrency(price)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      isSelected
                        ? 'border-[var(--gold)] bg-[var(--gold)] text-ink'
                        : 'border-cream-dark text-muted-foreground group-hover/service:border-[var(--gold)]/60',
                    )}
                  >
                    {isSelected ? (
                      <Check className="size-4" strokeWidth={2.5} />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
