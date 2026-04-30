import { Inbox } from 'lucide-react';
import type { Metadata } from 'next';

import { DraftCard } from '@/components/drafts/draft-card';
import { Card, CardContent } from '@/components/ui/card';
import { listDrafts } from '@/lib/queries/booking-drafts';

export const metadata: Metadata = {
  title: 'Agendamentos pendentes',
};

export default async function DraftsPage() {
  const drafts = await listDrafts('pending');

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <div className="h-px w-8 bg-[var(--gold)]" />
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Agendamentos pendentes
        </h1>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Clientes agendaram pelo seu link e estão aguardando sua confirmação
        </p>
      </header>

      {drafts.length === 0 ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-[var(--gold)]/10">
              <Inbox className="size-8 text-[var(--gold)]" strokeWidth={1.25} />
            </div>
            <p className="font-serif text-2xl italic text-foreground">Nada pendente</p>
            <p className="text-sm text-muted-foreground">
              Quando alguém agendar pelo seu link público, aparece aqui pra você confirmar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <DraftCard draft={draft} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
