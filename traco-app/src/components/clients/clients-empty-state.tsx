import { UserRound } from 'lucide-react';

import { NewClientButton } from './new-client-button';

export function ClientsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-[var(--gold)]/10">
        <UserRound className="size-10 text-[var(--gold)]" strokeWidth={1.25} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-serif text-2xl italic text-foreground">
          Nenhuma cliente cadastrada ainda
        </p>
        <p className="text-sm text-muted-foreground">
          Comece adicionando sua primeira cliente.
        </p>
      </div>
      <NewClientButton />
    </div>
  );
}
