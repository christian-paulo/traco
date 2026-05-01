'use client';

import { Check, Copy, Download, Loader2, Share2 } from 'lucide-react';
import { useState, useTransition } from 'react';
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
import { markReportShared } from '@/server/actions/sharing';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string | null;
  imageUrl: string | null;
};

async function downloadImage(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objUrl);
}

export function ReportResultDialog({ open, onOpenChange, reportId, imageUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  function markShared() {
    if (!reportId) return;
    startTransition(async () => {
      await markReportShared(reportId);
    });
  }

  async function handleDownload() {
    if (!imageUrl) return;
    try {
      await downloadImage(imageUrl, `traco-resumo-${Date.now()}.png`);
      toast.success('Imagem baixada.');
      markShared();
    } catch {
      toast.error('Erro ao baixar.');
    }
  }

  async function handleShare() {
    if (!imageUrl) return;
    if (typeof navigator === 'undefined') return;

    try {
      // Tenta Web Share API com arquivo
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], 'traco-resumo.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Traço · resumo',
          text: 'Compartilhando do Traço',
          files: [file],
        });
        markShared();
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: 'Traço · resumo',
          text: 'Compartilhando do Traço',
          url: imageUrl,
        });
        markShared();
        return;
      }

      // Fallback desktop: baixa + instrução
      await downloadImage(imageUrl, `traco-resumo-${Date.now()}.png`);
      toast.success('Imagem baixada — abra no celular pra postar nos Stories.');
      markShared();
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      toast.error('Não foi possível compartilhar.');
    }
  }

  async function handleCopyLink() {
    if (!imageUrl) return;
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      toast.success('Link copiado.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resumo gerado</DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Pronto pra postar no Stories ou no feed.
          </p>
        </DialogHeader>
        <DialogBody>
          <div className="flex justify-center">
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt="Resumo gerado"
                className="max-h-[60vh] w-auto rounded-lg shadow-lg"
              />
            ) : (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            variant="premium"
            className="w-full"
            onClick={handleShare}
            disabled={!imageUrl}
          >
            <Share2 className="size-4" />
            Compartilhar nos Stories
          </Button>
          <div className="flex w-full gap-2">
            <Button
              variant="outline-gold"
              className="flex-1"
              onClick={handleDownload}
              disabled={!imageUrl}
            >
              <Download className="size-4" />
              Baixar
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={handleCopyLink}
              disabled={!imageUrl}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copiado' : 'Copiar link'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
