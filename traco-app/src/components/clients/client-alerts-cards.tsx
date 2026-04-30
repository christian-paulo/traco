'use client';

import { AlertTriangle, ChevronRight, Pin, ShieldAlert } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import type { CriticalAlert } from '@/lib/anamnesis/critical-answers';
import { formatDate } from '@/lib/format';
import type { NoteRow } from '@/lib/queries/professional-notes';
import type { ReactionRow } from '@/lib/queries/reactions';
import { cn } from '@/lib/utils';

type Props = {
  reactions: ReactionRow[];
  notes: NoteRow[];
  criticalAlerts: CriticalAlert[];
  onViewReactions: () => void;
  onViewNotes: () => void;
};

export function ClientAlertsCards({
  reactions,
  notes,
  criticalAlerts,
  onViewReactions,
  onViewNotes,
}: Props) {
  const activeReactions = reactions.filter((r) => r.status === 'active');
  const pinnedNotes = notes.filter((n) => n.pinned).slice(0, 3);

  if (activeReactions.length === 0 && pinnedNotes.length === 0 && criticalAlerts.length === 0) {
    return null;
  }

  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {activeReactions.length > 0 ? (
        <button
          type="button"
          onClick={onViewReactions}
          className="text-left"
          aria-label={`${activeReactions.length} reações ativas — abrir aba`}
        >
          <Card
            variant="premium"
            className="border-0 bg-red-50 ring-1 ring-red-200 transition-all hover:shadow-lg"
          >
            <CardContent className="flex items-start gap-3 border-l-4 border-red-500 px-5 py-4">
              <AlertTriangle className="size-5 shrink-0 text-red-600" />
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-red-700">
                  {activeReactions.length}{' '}
                  {activeReactions.length === 1 ? 'reação ativa' : 'reações ativas'} — atenção
                </p>
                <ul className="flex flex-col gap-1 text-xs text-red-900/80">
                  {activeReactions.slice(0, 2).map((r) => (
                    <li key={r.id} className="line-clamp-1">
                      • {r.symptoms}
                    </li>
                  ))}
                  {activeReactions.length > 2 ? (
                    <li className="text-[10px] uppercase tracking-[0.14em] text-red-700/60">
                      e mais {activeReactions.length - 2}…
                    </li>
                  ) : null}
                </ul>
                <p className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.16em] text-red-700">
                  Ver detalhes <ChevronRight className="size-3" />
                </p>
              </div>
            </CardContent>
          </Card>
        </button>
      ) : null}

      {pinnedNotes.length > 0 ? (
        <button
          type="button"
          onClick={onViewNotes}
          className="text-left"
          aria-label="Ver notas fixadas"
        >
          <Card
            variant="premium"
            className="border-0 bg-cream-dark/60 ring-1 ring-[var(--gold)]/30 transition-all hover:shadow-lg"
          >
            <CardContent className="flex items-start gap-3 border-l-4 border-[var(--gold)] px-5 py-4">
              <Pin className="size-5 shrink-0 text-[var(--gold)]" />
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/80">
                  {pinnedNotes.length}{' '}
                  {pinnedNotes.length === 1 ? 'nota fixada' : 'notas fixadas'}
                </p>
                <ul className="flex flex-col gap-1 text-xs text-foreground/80">
                  {pinnedNotes.map((n) => (
                    <li key={n.id} className="line-clamp-1">
                      <span className="font-medium">{n.title}:</span>{' '}
                      <span>{n.content.slice(0, 80)}</span>
                    </li>
                  ))}
                </ul>
                <p className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.16em] text-foreground/70">
                  Ver todas <ChevronRight className="size-3" />
                </p>
              </div>
            </CardContent>
          </Card>
        </button>
      ) : null}

      {criticalAlerts.length > 0 ? (
        <Card
          variant="premium"
          className={cn(
            'border-0 bg-amber-50 ring-1 ring-amber-200',
            !activeReactions.length && !pinnedNotes.length && 'md:col-span-2 lg:col-span-1',
          )}
        >
          <CardContent className="flex items-start gap-3 border-l-4 border-amber-500 px-5 py-4">
            <ShieldAlert className="size-5 shrink-0 text-amber-600" />
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-800">
                Avisos clínicos da ficha
              </p>
              <ul className="flex flex-col gap-1 text-xs text-amber-900/85">
                {criticalAlerts.slice(0, 4).map((a, idx) => (
                  <li key={idx} className="leading-snug">
                    • {a.text}
                  </li>
                ))}
                {criticalAlerts.length > 4 ? (
                  <li className="text-[10px] uppercase tracking-[0.14em] text-amber-700/70">
                    e mais {criticalAlerts.length - 4}…
                  </li>
                ) : null}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

export type { CriticalAlert };
export { formatDate };
