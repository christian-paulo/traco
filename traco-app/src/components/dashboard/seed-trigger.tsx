'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { seedTestData } from '@/server/actions/seed';

export function SeedTrigger() {
  const [pending, startTransition] = useTransition();
  const [isDev, setIsDev] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === 'development');
  }, []);

  useEffect(() => {
    if (!isDev) return;
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        setShown((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDev]);

  if (!isDev || !shown) return null;

  function handleSeed() {
    startTransition(async () => {
      const result = await seedTestData();
      if (result.success) {
        toast.success(
          `Seed concluído: ${result.summary.clients} clientes, ${result.summary.appointments} atendimentos, ${result.summary.reactions} reações, ${result.summary.notes} notas.`,
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="fixed bottom-4 left-4 z-30 flex flex-col gap-2 rounded-lg border-2 border-dashed border-[var(--gold)] bg-card px-4 py-3 shadow-lg">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        DEV · Seed (Ctrl+Shift+S)
      </p>
      <button
        type="button"
        onClick={handleSeed}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-md bg-[var(--gold)] px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-ink hover:bg-[var(--gold)]/90 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Sparkles className="size-3.5" />
        )}
        Popular dados de teste
      </button>
    </div>
  );
}
