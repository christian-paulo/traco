'use client';

import { Check } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/format';
import type { PublicProfessional } from '@/lib/queries/public-booking';

type Props = {
  professional: PublicProfessional;
  onAdvance: () => void;
};

export function StepProfessional({ professional }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Profissional
        </h1>
      </div>

      <button
        type="button"
        className="flex items-start gap-4 rounded-xl border border-[var(--gold)] bg-card p-5 text-left shadow-sm ring-2 ring-[var(--gold)]/30"
        aria-pressed="true"
      >
        <Avatar className="size-14 border-2 border-[var(--gold)]/40">
          {professional.avatar_url ? (
            <AvatarImage
              src={professional.avatar_url}
              alt={professional.display_name}
            />
          ) : null}
          <AvatarFallback className="bg-cream-dark text-foreground">
            {getInitials(professional.display_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="font-serif text-lg font-medium text-foreground">
            {professional.display_name}
          </p>
          {professional.role_title ? (
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {professional.role_title}
            </p>
          ) : null}
          {professional.bio ? (
            <p className="font-serif text-sm italic text-foreground/80">{professional.bio}</p>
          ) : null}
        </div>
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--gold)] text-ink">
          <Check className="size-4" strokeWidth={2.5} />
        </span>
      </button>
    </div>
  );
}
