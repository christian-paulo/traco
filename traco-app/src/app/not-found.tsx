import { Compass } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="bg-cream flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-[var(--gold)]/10 text-[var(--gold)]">
          <Compass className="size-8" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="mx-auto h-px w-8 bg-[var(--gold)]" />
          <h1 className="font-serif text-3xl font-medium text-foreground">
            Página não encontrada
          </h1>
          <p className="text-sm text-muted-foreground">
            O endereço acessado não existe ou foi removido.
          </p>
        </div>
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: 'premium', size: 'xl' })}
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
