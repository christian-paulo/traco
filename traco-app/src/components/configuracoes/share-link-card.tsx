'use client';

import { Check, Copy, Loader2, MessageCircle, QrCode } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  publicUrl: string;
  studioName: string;
};

export function ShareLinkCard({ publicUrl, studioName }: Props) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Link copiado.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar.');
    }
  }

  function handleWhatsApp() {
    const msg = `Olá! Aqui está o link pra agendar comigo no ${studioName}: ${publicUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4 sm:p-5">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Seu link de agendamento
          </p>
          <code className="block break-all rounded bg-card px-3 py-2 font-mono text-sm text-foreground">
            {publicUrl}
          </code>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="premium" onClick={handleCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copiado' : 'Copiar link'}
          </Button>
          <Button variant="outline-gold" onClick={handleWhatsApp}>
            <MessageCircle className="size-4" />
            Compartilhar no WhatsApp
          </Button>
          <Button variant="ghost" onClick={() => setQrOpen(true)}>
            <QrCode className="size-4" />
            Gerar QR Code
          </Button>
        </div>
      </div>

      <QrDialog open={qrOpen} onOpenChange={setQrOpen} url={publicUrl} />
    </>
  );
}

function QrDialog({
  open,
  onOpenChange,
  url,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    setDataUrl(null);
    setLoading(true);
    let cancelled = false;
    (async () => {
      try {
        const QR = (await import('qrcode')).default;
        const result = await QR.toDataURL(url, {
          margin: 2,
          width: 512,
          color: { dark: '#0A0A0A', light: '#F5F1EA' },
          errorCorrectionLevel: 'M',
        });
        if (!cancelled) setDataUrl(result);
      } catch (err) {
        console.error('[qr] erro ao gerar:', err);
        if (!cancelled) toast.error('Erro ao gerar QR code.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, url]);

  function handleDownload() {
    if (!dataUrl || !linkRef.current) return;
    linkRef.current.href = dataUrl;
    linkRef.current.download = 'agendamento-traco.png';
    linkRef.current.click();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code do seu link</DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Use no Instagram, na vitrine ou imprima como cartão.
          </p>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col items-center gap-4">
            {loading || !dataUrl ? (
              <div className="flex size-48 items-center justify-center rounded-md bg-cream">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={dataUrl}
                alt="QR code do link de agendamento"
                className="size-56 rounded-md"
              />
            )}
            <p className="break-all text-center text-xs text-muted-foreground">{url}</p>
            {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
            <a ref={linkRef} className="hidden" />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button variant="premium" onClick={handleDownload} disabled={!dataUrl}>
            Baixar PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
