import { ChevronRight, Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, getInitials } from '@/lib/format';
import { getAnamnesisFormById } from '@/lib/queries/anamnesis';
import { getClientById } from '@/lib/queries/clients';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type Params = Promise<{ id: string; formId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { formId } = await params;
  return { title: `Ficha #${formId.slice(0, 8)} | Traço` };
}

function formatAnswer(
  field: { id: string; type: string; label: string },
  raw: unknown,
): string {
  if (raw === null || raw === undefined || raw === '') return '—';
  if (field.type === 'boolean') {
    if (raw === true || raw === 'true' || raw === 'sim') return 'Sim';
    if (raw === false || raw === 'false' || raw === 'nao') return 'Não';
  }
  return String(raw);
}

export default async function SignedFichaPage({ params }: { params: Params }) {
  const { id, formId } = await params;
  const [form, client] = await Promise.all([getAnamnesisFormById(formId), getClientById(id)]);
  if (!form || !client) notFound();
  if (form.client_id !== client.id) notFound();

  const fields = form.template.fields ?? [];
  const answers = (form.answers ?? {}) as Record<string, unknown>;

  return (
    <div className="flex flex-col gap-8">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
      >
        <Link href="/dashboard/clientes" className="transition-colors hover:text-[var(--gold)]">
          Clientes
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/dashboard/clientes/${client.id}`}
          className="transition-colors hover:text-[var(--gold)]"
        >
          {client.full_name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">Ficha</span>
      </nav>

      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="size-16 border-2 border-[var(--gold)]/40">
            <AvatarFallback className="bg-cream text-[var(--gold)] text-xl font-medium">
              {getInitials(client.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <div className="h-px w-8 bg-[var(--gold)]" />
            <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
              Ficha de anamnese
            </h1>
            <p className="text-sm text-muted-foreground">
              {client.full_name}
              {form.signed_at ? (
                <>
                  {' '}· Assinada em {formatDate(form.signed_at, 'long')}
                </>
              ) : null}
            </p>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  form.status === 'signed'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                    : form.status === 'pending'
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700'
                      : 'border-muted-foreground/30 bg-muted text-muted-foreground'
                }
              >
                {form.status === 'signed'
                  ? 'Assinada'
                  : form.status === 'pending'
                    ? 'Pendente'
                    : 'Expirada'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                #{form.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        {form.pdf_url ? (
          <a
            href={form.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'outline-gold' })}
          >
            <Download className="size-4" />
            Baixar PDF
          </a>
        ) : null}
      </header>

      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
        <CardContent className="px-6">
          <div className="flex flex-col gap-6">
            {fields.length === 0 ? (
              <p className="font-serif text-base italic text-muted-foreground">
                Esta ficha não possui campos.
              </p>
            ) : (
              fields.map((field) => (
                <div key={field.id} className="flex flex-col gap-1">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {field.label}
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {formatAnswer(field, answers[field.id])}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {form.signature_png ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-6">
          <CardContent className="flex flex-col gap-3 px-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Assinatura digital
            </p>
            <div className="overflow-hidden rounded-lg border border-[var(--gold)]/30 bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.signature_png}
                alt="Assinatura da cliente"
                className="mx-auto max-h-40 object-contain"
              />
            </div>
            <div className="h-px w-full bg-[var(--gold)]/40" />
            <dl className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <div>
                <dt className="font-medium">Assinada em</dt>
                <dd>
                  {form.signed_at
                    ? new Intl.DateTimeFormat('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(form.signed_at))
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="font-medium">IP</dt>
                <dd className="break-all">{form.signer_ip ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-medium">Hash</dt>
                <dd className="break-all font-mono text-[10px]">
                  {form.integrity_hash?.slice(0, 16)}...
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
