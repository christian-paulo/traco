'use client';

import { Loader2, RotateCcw } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { restartOnboarding } from '@/server/actions/onboarding';

export function RestartOnboardingButton() {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        'Refazer o onboarding completo? Você vai passar pelos 5 passos de novo (não perde nenhum dado já cadastrado).',
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await restartOnboarding();
      if (result && 'success' in result && !result.success) {
        toast.error(result.error || 'Erro ao reiniciar.');
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      className="gap-2"
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <RotateCcw className="size-3.5" />
      )}
      Refazer onboarding
    </Button>
  );
}
