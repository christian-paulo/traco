'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatRelativeDate } from '@/lib/format';
import { generateGoalStrategy } from '@/server/actions/goal-strategy';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  goalTitle: string;
  initialStrategy: string | null;
  initialGeneratedAt: string | null;
};

export function GoalStrategyDialog({
  open,
  onOpenChange,
  goalId,
  goalTitle,
  initialStrategy,
  initialGeneratedAt,
}: Props) {
  const [strategy, setStrategy] = useState<string | null>(initialStrategy);
  const [generatedAt, setGeneratedAt] = useState<string | null>(initialGeneratedAt);
  const [cached, setCached] = useState<boolean>(Boolean(initialStrategy));
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setStrategy(initialStrategy);
      setGeneratedAt(initialGeneratedAt);
      setCached(Boolean(initialStrategy));
    }
  }, [open, initialStrategy, initialGeneratedAt]);

  function handleGenerate(forceRefresh: boolean = false) {
    if (forceRefresh) {
      // limpa pra forçar nova geração visualmente; o cache servidor ainda valida 24h
      setStrategy(null);
    }
    startTransition(async () => {
      const r = await generateGoalStrategy(goalId);
      if (r.success) {
        setStrategy(r.data.strategy);
        setGeneratedAt(r.data.generatedAt);
        setCached(r.data.cached);
        if (r.data.cached && forceRefresh) {
          toast.info('Análise de hoje já gerada — cache renova após 24h.');
        }
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-[var(--gold)]" />
            Estratégia com IA
          </DialogTitle>
          <DialogDescription>
            {goalTitle} · análise gerada por Claude com base nos seus dados reais
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {strategy ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-5">
                <p className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-foreground">
                  {strategy}
                </p>
              </div>
              <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {cached ? '★ Análise em cache' : '✨ Análise gerada agora'}
                {generatedAt ? <span>· {formatRelativeDate(generatedAt)}</span> : null}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <Sparkles className="size-10 text-[var(--gold)]" strokeWidth={1.25} />
              <p className="font-serif text-base italic text-muted-foreground">
                Gere uma estratégia personalizada baseada nos seus números atuais.
              </p>
              <p className="text-xs text-muted-foreground">
                Limite: 1 análise por meta a cada 24h.
              </p>
              <Button
                variant="premium"
                size="xl"
                onClick={() => handleGenerate(false)}
                disabled={pending}
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Gerar estratégia
              </Button>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Fechar
          </Button>
          {strategy ? (
            <Button
              variant="premium"
              onClick={() => handleGenerate(true)}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Atualizar
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
