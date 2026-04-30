import { ChevronRight, Pin } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatRelativeDate } from '@/lib/format';
import type { PinnedNoteSummary } from '@/lib/queries/dashboard';

type Props = {
  notes: PinnedNoteSummary[];
};

export function PinnedNotesCard({ notes }: Props) {
  return (
    <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-3">
        <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium">
          <Pin className="size-4 text-[var(--gold)]" />
          Notas em destaque
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        {notes.length === 0 ? (
          <p className="font-serif text-base italic text-muted-foreground">
            Comece a anotar — cada cliente tem detalhes que valem ouro.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-cream-dark">
            {notes.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/dashboard/clientes/${n.client_id}`}
                  className="group/note -mx-2 flex flex-col gap-1 rounded-md px-2 py-2.5 transition-colors hover:bg-cream-dark/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {n.title}
                    </p>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover/note:translate-x-0.5" />
                  </div>
                  <p className="line-clamp-2 text-xs text-foreground/70">{n.content}</p>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {n.client_name} · {formatRelativeDate(n.created_at)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
