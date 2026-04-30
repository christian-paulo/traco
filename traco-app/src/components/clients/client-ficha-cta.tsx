'use client';

import { FileText, Send } from 'lucide-react';
import { useState } from 'react';

import { SendAnamnesisDialog } from '@/components/anamnesis/send-anamnesis-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Props = {
  client: { id: string; full_name: string; email: string | null };
  hasPending: boolean;
  hasExpired: boolean;
};

export function ClientFichaCTA({ client, hasPending, hasExpired }: Props) {
  const [open, setOpen] = useState(false);

  const message = hasExpired
    ? 'A última ficha desta cliente venceu. Envie uma nova para manter o cadastro em dia.'
    : hasPending
      ? 'Existe uma ficha pendente. Você pode reenviar ou enviar uma nova.'
      : 'Esta cliente ainda não preencheu ficha de anamnese.';

  return (
    <>
      <Card
        variant="premium"
        className="border-0 bg-gradient-to-br from-[var(--gold)]/10 to-cream/40 ring-1 ring-[var(--gold)]/30"
      >
        <CardContent className="flex flex-col items-center gap-4 px-6 py-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--gold)]/20">
            <FileText className="size-8 text-[var(--gold)]" strokeWidth={1.25} />
          </div>
          <p className="font-serif text-lg italic text-foreground">{message}</p>
          <Button variant="premium" size="xl" onClick={() => setOpen(true)}>
            <Send className="size-4" />
            Enviar ficha agora
          </Button>
        </CardContent>
      </Card>

      <SendAnamnesisDialog open={open} onOpenChange={setOpen} client={client} />
    </>
  );
}
