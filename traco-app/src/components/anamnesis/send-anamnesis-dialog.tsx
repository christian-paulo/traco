'use client';

import { Check, CheckCircle2, Copy, Loader2, MailWarning } from 'lucide-react';
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

type Step = 'form' | 'success';

export function SendAnamnesisDialog({ open, onOpenChange, client }: Props) {
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>('form');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      // reset apenas quando o dialog fecha de fato
      const t = setTimeout(() => {
        setStep('form');
        setGeneratedLink(null);
        setEmailSent(false);
        setCopied(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  function handleCreate() {
    startTransition(async () => {
      const result = await createAnamnesisLink(client.id);
      if (result.success) {
        setGeneratedLink(result.data.public_url);
        setEmailSent(result.data.emailSent);
        setStep('success');
      } else {
        toast.error(result.error || 'Não foi possível criar a ficha.');
      }
    });
  }

  async function handleCopy() {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === 'form' ? 'Enviar ficha de anamnese' : 'Link gerado com sucesso'}
          </DialogTitle>
          <DialogDescription>
            {step === 'form'
              ? client.email
                ? 'A cliente receberá um email com o link.'
                : 'Crie um link único para a cliente preencher.'
              : 'Compartilhe o link com a cliente.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {step === 'form' ? (
            <>
              <div className="bg-cream/50 mb-5 flex items-center gap-3 rounded-lg border border-cream-dark p-3">
                <Avatar className="size-10 border border-[var(--gold)]/40">
                  <AvatarFallback className="bg-cream text-[var(--gold)] text-xs font-medium">
                    {getInitials(client.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <p className="truncate text-sm font-medium text-foreground">
                    {client.full_name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {client.email ?? 'Sem email cadastrado'}
                  </p>
                </div>
              </div>

              {client.email ? (
                <div className="flex items-start gap-3 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3">
                  <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-[var(--gold)]" />
                  <p className="text-xs leading-relaxed text-foreground">
                    O link será enviado automaticamente para{' '}
                    <strong>{client.email}</strong>.
                  </p>
                </div>
              ) : (
                <div className="text-amber-700 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
                  <MailWarning className="size-4 mt-0.5 shrink-0" />
                  <p className="text-xs leading-relaxed">
                    Esta cliente não tem email cadastrado. Vamos gerar o link e você poderá
                    copiar e enviar manualmente (WhatsApp, por exemplo).
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-[var(--gold)]/10">
                  <CheckCircle2
                    className="size-8 text-[var(--gold)]"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground">
                  Link gerado com sucesso
                </h3>
              </div>

              {emailSent && client.email ? (
                <div className="flex items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs">
                  <Check className="size-3.5 text-emerald-700" />
                  <span className="font-medium text-emerald-700">
                    Email enviado para {client.email}
                  </span>
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Compartilhe o link manualmente com a cliente.
                </p>
              )}

              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Link da ficha
                </p>
                <Input
                  value={generatedLink ?? ''}
                  readOnly
                  className="h-12 font-mono text-xs"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                  type="button"
                  variant="default"
                  onClick={handleCopy}
                  className="h-11 w-full"
                >
                  {copied ? (
                    <>
                      <Check className="size-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copiar link
                    </>
                  )}
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Este link expira em 7 dias.
              </p>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          {step === 'form' ? (
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
          ) : (
            <Button
              type="button"
              variant="default"
              onClick={() => onOpenChange(false)}
              className="h-10 sm:w-auto w-full"
            >
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
