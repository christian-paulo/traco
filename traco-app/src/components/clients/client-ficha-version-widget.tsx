'use client';

import { ChevronRight, FileText, History } from 'lucide-react';
import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatRelativeDate } from '@/lib/format';
import type { AnamnesisVersionRow } from '@/lib/queries/anamnesis';

import { AnamnesisVersionHistoryDialog } from './anamnesis-version-history-dialog';

type Props = {
  versions: AnamnesisVersionRow[];
  pdfUrl: string | null;
};

export function ClientFichaVersionWidget({ versions, pdfUrl }: Props) {
  const [open, setOpen] = useState(false);

  if (versions.length === 0) return null;

  const sorted = [...versions].sort((a, b) => b.version_number - a.version_number);
  const current = sorted[0];
  const original = sorted.find((v) => v.is_original) ?? null;
  const editCount = sorted.filter((v) => !v.is_original).length;

  return (
    <>
      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
          <CardTitle className="flex items-center gap-2 font-serif text-lg font-medium">
            <FileText className="size-4 text-[var(--gold)]" />
            Ficha de anamnese
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/85">
            <span>
              Versão atual: <strong>{current.version_number}</strong>
            </span>
            <span className="text-muted-foreground">·</span>
            <span>
              Última atualização:{' '}
              <span className="text-foreground">{formatRelativeDate(current.created_at)}</span>
            </span>
            {editCount > 0 ? (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {editCount} {editCount === 1 ? 'edição' : 'edições'} desde a original
                </span>
              </>
            ) : null}
          </div>

          {original?.signed_at ? (
            <p className="text-xs text-muted-foreground">
              Assinatura original: {formatDate(original.signed_at, 'long')}
            </p>
          ) : null}

          {!current.is_original && current.edit_reason ? (
            <p className="rounded border border-cream-dark bg-cream/40 px-3 py-2 text-xs text-foreground/80">
              <span className="font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Motivo da última edição:{' '}
              </span>
              {current.edit_reason}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex w-fit items-center gap-1 text-xs font-medium uppercase tracking-[0.16em] text-[var(--gold)] hover:underline"
          >
            <History className="size-3.5" />
            Ver histórico de versões
            <ChevronRight className="size-3" />
          </button>
        </CardContent>
      </Card>

      <AnamnesisVersionHistoryDialog
        open={open}
        onOpenChange={setOpen}
        versions={versions}
        pdfUrl={pdfUrl}
      />
    </>
  );
}
