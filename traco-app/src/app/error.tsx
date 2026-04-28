'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <main className="bg-cream flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-8" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="mx-auto h-px w-8 bg-[var(--gold)]" />
          <h1 className="font-serif text-3xl font-medium text-foreground">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar esta página. Tente novamente em alguns segundos.
          </p>
          {error.digest ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              ref · {error.digest}
            </p>
          ) : null}
        </div>
        <Button variant="default" onClick={reset} className="h-11">
          <RotateCcw className="size-4" />
          Tentar novamente
        </Button>
      </div>
    </main>
  );
}
