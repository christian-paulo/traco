'use client';

import {
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Send,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/format';
import type { AnamnesisFormRow } from '@/lib/queries/anamnesis';
import { cn } from '@/lib/utils';
import { deleteAnamnesisForm, resendAnamnesisLink } from '@/server/actions/anamnesis';

import { SendAnamnesisDialog } from './send-anamnesis-dialog';

type Props = {
  client: { id: string; full_name: string; email: string | null };
  forms: AnamnesisFormRow[];
};

type Status = 'pending' | 'signed' | 'expired';

function effectiveStatus(form: AnamnesisFormRow): Status {
  if (form.status === 'signed') return 'signed';
  if (new Date(form.expires_at).getTime() < Date.now()) return 'expired';
  return 'pending';
}

const statusBadge: Record<
  Status,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pendente',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  },
  signed: {
    label: 'Assinada',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  },
  expired: {
    label: 'Expirada',
    className: 'border-muted-foreground/30 bg-muted text-muted-foreground',
  },
};

export function AnamnesisSection({ client, forms }: Props) {
  const [sendOpen, setSendOpen] = useState(false);
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  if (forms.length === 0) {
    return (
      <>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            0 fichas
          </p>
          <Button variant="outline-gold" onClick={() => setSendOpen(true)}>
            <Send className="size-4" />
            Enviar nova ficha
          </Button>
        </div>
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-[var(--gold)]/10">
              <FileText className="size-8 text-[var(--gold)]" strokeWidth={1.25} />
            </div>
            <p className="font-serif text-lg italic text-muted-foreground">
              Nenhuma ficha enviada ainda.
            </p>
            <Button variant="premium" size="xl" onClick={() => setSendOpen(true)}>
              <Send className="size-4" />
              Enviar primeira ficha
            </Button>
          </CardContent>
        </Card>
        <SendAnamnesisDialog open={sendOpen} onOpenChange={setSendOpen} client={client} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {forms.length} {forms.length === 1 ? 'ficha' : 'fichas'}
        </p>
        <Button variant="outline-gold" onClick={() => setSendOpen(true)}>
          <Send className="size-4" />
          Enviar nova ficha
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {forms.map((form) => (
          <FormCard key={form.id} form={form} clientId={client.id} origin={origin} />
        ))}
      </div>

      <SendAnamnesisDialog open={sendOpen} onOpenChange={setSendOpen} client={client} />
    </div>
  );
}

function FormCard({
  form,
  clientId,
  origin,
}: {
  form: AnamnesisFormRow;
  clientId: string;
  origin: string | null;
}) {
  const status = effectiveStatus(form);
  const badge = statusBadge[status];
  const [resending, startResend] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [copied, setCopied] = useState(false);

  const publicUrl =
    form.public_token && origin ? `${origin}/ficha/${form.public_token}` : null;

  async function handleCopy() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Link copiado.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar.');
    }
  }

  function handleResend() {
    startResend(async () => {
      const result = await resendAnamnesisLink(form.id);
      if (result.success) toast.success('Email reenviado.');
      else toast.error(result.error || 'Erro ao reenviar.');
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const result = await deleteAnamnesisForm(form.id);
      if (result.success) toast.success('Ficha excluída.');
      else toast.error(result.error || 'Erro ao excluir.');
    });
  }

  return (
    <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-5">
      <CardContent className="flex flex-col gap-3 px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <Badge variant="outline" className={cn('self-start', badge.className)}>
              {badge.label}
            </Badge>
            <p className="font-serif text-lg font-medium text-foreground">
              Ficha de anamnese
            </p>
            <p className="text-xs text-muted-foreground">
              Criada em {formatDate(form.created_at, 'short')}
              {form.signed_at ? (
                <> · Assinada em {formatDate(form.signed_at, 'short')}</>
              ) : null}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Ações"
                  className="size-8"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              {status === 'signed' ? (
                <DropdownMenuItem
                  render={
                    <Link href={`/dashboard/clientes/${clientId}/fichas/${form.id}`} />
                  }
                >
                  <Eye className="size-4" />
                  Ver detalhes
                </DropdownMenuItem>
              ) : null}
              {status === 'pending' && publicUrl ? (
                <>
                  <DropdownMenuItem onClick={handleCopy}>
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    Copiar link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleResend} disabled={resending}>
                    <Send className="size-4" />
                    Reenviar email
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="size-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2">
          {status === 'signed' && form.pdf_url ? (
            <a
              href={form.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--gold)] bg-transparent px-3 py-1.5 text-xs font-medium uppercase tracking-[0.1em] text-[var(--gold)] hover:bg-[var(--gold)]/10"
            >
              <Download className="size-3.5" />
              Baixar PDF
            </a>
          ) : null}
          {status === 'signed' ? (
            <Link
              href={`/dashboard/clientes/${clientId}/fichas/${form.id}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium uppercase tracking-[0.1em] text-background hover:bg-[var(--gold)] hover:text-ink"
            >
              <Eye className="size-3.5" />
              Ver detalhes
            </Link>
          ) : null}
          {status === 'pending' && publicUrl ? (
            <>
              <Button
                variant="outline-gold"
                size="sm"
                className="h-8"
                onClick={handleCopy}
              >
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? 'Copiado' : 'Copiar link'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                Reenviar email
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
