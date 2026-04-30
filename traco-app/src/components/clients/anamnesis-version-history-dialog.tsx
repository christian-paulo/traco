'use client';

import { ChevronDown, ChevronUp, Download, FileText, Lock, Pencil, Shield } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import type { AnamnesisVersionRow } from '@/lib/queries/anamnesis';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: AnamnesisVersionRow[];
  pdfUrl: string | null;
};

export function AnamnesisVersionHistoryDialog({
  open,
  onOpenChange,
  versions,
  pdfUrl,
}: Props) {
  const sorted = [...versions].sort((a, b) => a.version_number - b.version_number);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de versões da ficha</DialogTitle>
        </DialogHeader>
        <DialogBody className="max-h-[75vh]">
          {sorted.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              Nenhuma versão registrada ainda.
            </p>
          ) : (
            <div className="relative flex flex-col gap-3 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-cream-dark">
              {sorted.map((version) => (
                <VersionCard key={version.id} version={version} pdfUrl={pdfUrl} />
              ))}
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function VersionCard({
  version,
  pdfUrl,
}: {
  version: AnamnesisVersionRow;
  pdfUrl: string | null;
}) {
  const [open, setOpen] = useState(version.is_original);
  const [pending, startTransition] = useTransition();

  function handleDownload() {
    if (!pdfUrl) {
      toast.error('PDF original não disponível.');
      return;
    }
    startTransition(() => {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer');
    });
  }

  return (
    <div className="relative">
      <span
        className={cn(
          'absolute -left-[1.4rem] top-3 inline-block size-3 rounded-full border-2',
          version.is_original
            ? 'border-[var(--gold)] bg-[var(--gold)]'
            : 'border-[var(--gold)] bg-cream',
        )}
        aria-hidden
      />
      <div
        className={cn(
          'flex flex-col gap-2 rounded-lg border bg-card px-4 py-3',
          version.is_original
            ? 'border-[var(--gold)]/40 ring-1 ring-[var(--gold)]/20'
            : 'border-cream-dark',
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="font-serif text-base font-medium text-foreground">
              Versão {version.version_number}
            </p>
            {version.is_original ? (
              <Badge
                variant="outline"
                className="border-[var(--gold)]/50 bg-[var(--gold)]/15 text-[10px] uppercase tracking-[0.14em]"
              >
                <Shield className="size-3" />
                Original assinada
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-[10px] uppercase tracking-[0.14em] text-amber-800"
              >
                <Pencil className="size-3" />
                Editada
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDate(version.created_at, 'short')}
          </p>
        </div>

        {version.is_original ? (
          <div className="flex flex-col gap-1.5 rounded border border-[var(--gold)]/20 bg-cream/40 px-3 py-2 text-xs">
            {version.signed_at ? (
              <p className="text-muted-foreground">
                Assinada em {formatDate(version.signed_at, 'long')}
              </p>
            ) : null}
            {version.signer_ip ? (
              <p className="text-muted-foreground">
                IP do assinante: <span className="font-mono">{version.signer_ip}</span>
              </p>
            ) : null}
            {version.signature_png ? (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Assinatura
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={version.signature_png}
                  alt="Assinatura"
                  className="h-16 w-auto self-start rounded bg-white p-1"
                />
              </div>
            ) : null}
            <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-[var(--gold)]">
              <Lock className="size-3" />
              Esta versão é imutável e tem valor jurídico.
            </p>
          </div>
        ) : (
          <>
            {version.edited_by_name ? (
              <p className="text-xs text-muted-foreground">
                Editada por {version.edited_by_name}
              </p>
            ) : null}
            {version.edit_reason ? (
              <p className="rounded border border-cream-dark bg-cream/40 px-2 py-1.5 text-xs text-foreground/80">
                <span className="font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Motivo:{' '}
                </span>
                {version.edit_reason}
              </p>
            ) : null}
          </>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
            {open ? 'Ocultar respostas' : 'Ver respostas desta versão'}
          </Button>
          {version.is_original && pdfUrl ? (
            <Button
              variant="outline-gold"
              size="sm"
              className="h-8"
              onClick={handleDownload}
              disabled={pending}
            >
              <Download className="size-3.5" />
              Baixar PDF original
            </Button>
          ) : null}
        </div>

        {open ? (
          <div className="rounded border border-cream-dark bg-cream/30 p-3">
            <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              <FileText className="size-3" />
              Respostas
            </div>
            <ul className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              {Object.entries(version.answers).map(([key, value]) => (
                <li key={key} className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {key}
                  </span>
                  <span className="break-words text-foreground/85">
                    {formatAnswerValue(value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function formatAnswerValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    const o = value as { value?: unknown; text?: string; accepted?: boolean; signed_at?: string };
    if (o.accepted !== undefined) {
      return o.accepted
        ? `Aceito${o.signed_at ? ` em ${formatDate(o.signed_at, 'short')}` : ''}`
        : 'Não aceito';
    }
    if (o.value !== undefined) {
      const yes = o.value === true;
      if (!yes) return 'Não';
      return o.text?.trim() ? `Sim — ${o.text}` : 'Sim';
    }
    return JSON.stringify(value);
  }
  return String(value);
}
