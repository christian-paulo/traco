'use client';

import { Check, Loader2, Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate, formatRelativeDate, getInitials } from '@/lib/format';
import type { ClientToRecover } from '@/lib/queries/clients';
import { digitsOnly } from '@/lib/utils/phone';
import { cn } from '@/lib/utils';
import {
  sendBulkRecoveryEmails,
  sendRecoveryEmail,
} from '@/server/actions/clients';

type Props = {
  clients: ClientToRecover[];
  whatsappTemplate: string;
};

const FILTER_OPTIONS = ['all', 'with-email', 'without-email'] as const;
type Filter = (typeof FILTER_OPTIONS)[number];

const RECENT_EMAIL_THRESHOLD_DAYS = 7;

function recentlyEmailed(iso: string | null): boolean {
  if (!iso) return false;
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return days < RECENT_EMAIL_THRESHOLD_DAYS;
}

function buildWhatsappLink(
  designerWhatsapp: string,
  template: string,
  client: ClientToRecover,
): string | null {
  const digits = digitsOnly(client.phone);
  if (!digits) return null;
  const e164 = digits.startsWith('55') ? digits : `55${digits}`;
  const message = template
    .replace('{dias}', String(client.days_overdue))
    .replace('{procedimento}', client.last_procedure_name ?? 'procedimento');
  void designerWhatsapp;
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}

function severityBadge(days: number) {
  if (days > 30) return 'border-destructive/40 bg-destructive/10 text-destructive';
  if (days > 14) return 'border-amber-500/40 bg-amber-500/10 text-amber-700';
  return 'border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold)]';
}

export function RecuperarList({ clients, whatsappTemplate }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [singleSending, setSingleSending] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'with-email') return clients.filter((c) => c.email);
    if (filter === 'without-email') return clients.filter((c) => !c.email);
    return clients;
  }, [clients, filter]);

  const allSelectedIds = useMemo(
    () => filtered.filter((c) => c.email).map((c) => c.client_id),
    [filtered],
  );
  const allSelected = allSelectedIds.length > 0 && allSelectedIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allSelectedIds));
    }
  }

  function handleSendOne(clientId: string) {
    setSingleSending(clientId);
    startTransition(async () => {
      const result = await sendRecoveryEmail(clientId);
      setSingleSending(null);
      if (result.success) toast.success('Email enviado.');
      else toast.error(result.error || 'Erro ao enviar.');
    });
  }

  function handleSendBulk() {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      toast.error('Selecione pelo menos uma cliente.');
      return;
    }
    startTransition(async () => {
      const result = await sendBulkRecoveryEmails(ids);
      const summary =
        result.failed === 0
          ? `${result.sent} ${result.sent === 1 ? 'email enviado' : 'emails enviados'}.`
          : `${result.sent} enviados, ${result.failed} falhas.`;
      if (result.sent > 0) toast.success(summary);
      else toast.error(summary);
      setSelected(new Set());
    });
  }

  if (clients.length === 0) {
    return (
      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
            <Check className="size-8 text-emerald-600" strokeWidth={1.5} />
          </div>
          <p className="font-serif text-2xl italic text-foreground">Tudo em dia! 🎉</p>
          <p className="text-sm text-muted-foreground">
            Nenhuma cliente com retorno atrasado no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={toggleAll} disabled={allSelectedIds.length === 0}>
            {allSelected ? 'Limpar seleção' : 'Selecionar todas com email'}
          </Button>
          <Select value={filter} onValueChange={(v) => setFilter((v ?? 'all') as Filter)}>
            <SelectTrigger className="h-9 sm:w-44">
              <SelectValue>
                {(value: string | null) => {
                  switch (value) {
                    case 'with-email':
                      return 'Só com email';
                    case 'without-email':
                      return 'Sem email';
                    default:
                      return 'Todas';
                  }
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="with-email">Só com email</SelectItem>
              <SelectItem value="without-email">Sem email</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="premium"
          size="xl"
          onClick={handleSendBulk}
          disabled={isPending || selected.size === 0}
        >
          {isPending && singleSending === null ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Mail className="size-4" />
          )}
          Enviar lembrete a {selected.size} {selected.size === 1 ? 'selecionada' : 'selecionadas'}
        </Button>
      </div>

      <ul className="flex flex-col gap-3">
        {filtered.map((client) => {
          const recent = recentlyEmailed(client.last_recovery_email_sent_at);
          const checked = selected.has(client.client_id);
          const whatsappUrl = buildWhatsappLink('', whatsappTemplate, client);
          const sendingNow = singleSending === client.client_id;
          return (
            <li key={client.client_id}>
              <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-5">
                <CardContent className="flex flex-col gap-4 px-6 lg:flex-row lg:items-start">
                  <label className="flex shrink-0 cursor-pointer items-start gap-3 lg:flex-1">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(client.client_id)}
                      disabled={!client.email}
                      className="mt-1 size-4 accent-[var(--gold)]"
                      aria-label={`Selecionar ${client.full_name}`}
                    />
                    <Avatar className="size-12 border-2 border-[var(--gold)]/40">
                      <AvatarFallback className="bg-cream text-[var(--gold)] text-sm font-medium">
                        {getInitials(client.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/clientes/${client.client_id}`}
                          className="font-serif text-lg font-medium text-foreground hover:text-[var(--gold)]"
                        >
                          {client.full_name}
                        </Link>
                        <Badge
                          variant="outline"
                          className={cn(severityBadge(client.days_overdue))}
                        >
                          Vencida há {client.days_overdue} dias
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Último:{' '}
                        {client.last_procedure_name ? (
                          <span className="font-medium text-foreground">
                            {client.last_procedure_name}
                          </span>
                        ) : (
                          'procedimento'
                        )}{' '}
                        em {formatDate(client.last_appointment_date, 'short')} · Retorno
                        previsto: {formatDate(client.return_due_date, 'short')}
                      </p>
                      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>📱 {client.phone}</span>
                        {client.email ? <span>✉ {client.email}</span> : null}
                      </p>
                      {recent ? (
                        <p className="text-xs text-emerald-600">
                          Email enviado {formatRelativeDate(client.last_recovery_email_sent_at)}
                        </p>
                      ) : null}
                    </div>
                  </label>

                  <div className="flex flex-wrap gap-2 lg:shrink-0">
                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[var(--gold)] bg-transparent px-3 text-xs font-medium uppercase tracking-[0.1em] text-[var(--gold)] transition-colors hover:bg-[var(--gold)]/10"
                      >
                        <MessageCircle className="size-3.5" />
                        WhatsApp
                      </a>
                    ) : null}
                    <Button
                      variant="default"
                      size="sm"
                      className="h-9"
                      onClick={() => handleSendOne(client.client_id)}
                      disabled={!client.email || isPending || recent}
                    >
                      {sendingNow ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Mail className="size-3.5" />
                      )}
                      Enviar email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
