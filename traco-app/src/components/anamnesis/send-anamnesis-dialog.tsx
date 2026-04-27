'use client';

import { Check, Copy, Loader2, MailWarning } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Input } from '@/components/ui/input';
import { getInitials } from '@/lib/format';
import { createAnamnesisLink } from '@/server/actions/anamnesis';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: { id: string; full_name: string; email: string | null };
};

export function SendAnamnesisDialog({ open, onOpenChange, client }: Props) {
  const [isPending, startTransition] = useTransition();
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setCreatedUrl(null);
      setCopied(false);
    }
  }, [open]);

  function handleCreate() {
    startTransition(async () => {
      const result = await createAnamnesisLink(client.id);
      if (result.success) {
        setCreatedUrl(result.data.public_url);
        if (client.email) {
          toast.success(`Ficha criada e enviada para ${client.email}.`);
        } else {
          toast.success('Ficha criada. Copie o link para enviar.');
        }
      } else {
        toast.error(result.error || 'Não foi possível criar a ficha.');
      }
    });
  }

  async function handleCopy() {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      toast.success('Link copiado.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar ficha de anamnese</DialogTitle>
          <DialogDescription>
            {client.email && !createdUrl
              ? 'A cliente receberá um email com o link.'
              : 'Crie um link único para a cliente preencher.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="bg-cream/50 mb-5 flex items-center gap-3 rounded-lg border border-cream-dark p-3">
            <Avatar className="size-10 border border-[var(--gold)]/40">
              <AvatarFallback className="bg-cream text-[var(--gold)] text-xs font-medium">
                {getInitials(client.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <p className="truncate text-sm font-medium text-foreground">{client.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {client.email ?? 'Sem email cadastrado'}
              </p>
            </div>
          </div>

          {!client.email && !createdUrl ? (
            <div className="text-amber-700 mb-5 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <MailWarning className="size-4 mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed">
                Esta cliente não tem email cadastrado. Vamos gerar o link e você pode copiar e
                enviar manualmente (WhatsApp, por exemplo).
              </p>
            </div>
          ) : null}

          {createdUrl ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Link da ficha
              </p>
              <div className="flex gap-2">
                <Input value={createdUrl} readOnly className="font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline-gold"
                  onClick={handleCopy}
                  className="h-11 shrink-0"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {client.email
                  ? `Email enviado para ${client.email}. Você também pode copiar e enviar manualmente.`
                  : 'Envie este link para a cliente. Expira em 7 dias.'}
              </p>
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter>
          {createdUrl ? (
            <Button
              type="button"
              variant="default"
              onClick={() => onOpenChange(false)}
              className="h-10 sm:w-auto w-full"
            >
              Fechar
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="h-10 sm:w-auto w-full"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleCreate}
                disabled={isPending}
                className="h-10 sm:w-auto w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  'Gerar link'
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
