'use client';

import {
  AlertTriangle,
  AtSign,
  Calendar,
  CheckCircle2,
  Droplets,
  History,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { CriticalAlert } from '@/lib/anamnesis/critical-answers';
import { formatCurrency, formatDate, getInitials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { updateClientSkinType } from '@/server/actions/clients';

import type { ClientLite, FichaState, PastAppointment } from '../atendimento-layout';

const PHOTOTYPES = ['I', 'II', 'III', 'IV', 'V', 'VI'] as const;

type Props = {
  client: ClientLite;
  criticalAlerts: CriticalAlert[];
  ficha: FichaState;
  pastAppointments: PastAppointment[];
};

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

function pickAnswerText(answers: Record<string, unknown>, key: string): string | null {
  const v = answers[key];
  if (typeof v === 'string' && v.trim()) return v;
  if (typeof v === 'object' && v !== null) {
    const o = v as { text?: string; value?: unknown };
    if (typeof o.text === 'string' && o.text.trim()) return o.text;
    if (typeof o.value === 'string' && o.value.trim()) return o.value;
  }
  return null;
}

export function TabResumo({ client, criticalAlerts, ficha, pastAppointments }: Props) {
  const [pending, startTransition] = useTransition();
  const age = calcAge(client.birth_date);
  const phoneDigits = (client.phone ?? '').replace(/\D/g, '');
  const whatsappUrl = phoneDigits
    ? `https://wa.me/${phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`}`
    : null;

  const cpf = pickAnswerText(ficha.currentAnswers, 'f_cpf');
  const instagram = pickAnswerText(ficha.currentAnswers, 'f_instagram');
  const water = pickAnswerText(ficha.currentAnswers, 'f_agua');
  const sleep = pickAnswerText(ficha.currentAnswers, 'f_sono');
  const food = pickAnswerText(ficha.currentAnswers, 'f_alimentacao');
  const activity = pickAnswerText(ficha.currentAnswers, 'f_atividade');
  const supplements = pickAnswerText(ficha.currentAnswers, 'f_suplementos');

  const completed = pastAppointments.filter((a) => a.status === 'completed');
  const totalSpent = completed.reduce((sum, a) => sum + a.price, 0);
  const ticket = completed.length > 0 ? totalSpent / completed.length : 0;
  const lastVisit = completed[0] ?? null;

  function handleSkinTypeChange(next: string | null) {
    startTransition(async () => {
      const result = await updateClientSkinType(client.id, next);
      if (result.success) {
        toast.success('Fototipo atualizado.');
      } else {
        toast.error(result.error || 'Erro ao atualizar fototipo.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
        <CardContent className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:gap-6">
          <Avatar className="size-16 shrink-0 border-2 border-[var(--gold)]/40">
            <AvatarFallback className="bg-cream-dark font-serif text-xl text-foreground">
              {getInitials(client.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col gap-2">
            <div>
              <p className="font-serif text-xl font-medium text-foreground">
                {client.full_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {age !== null ? `${age} anos` : 'Idade não informada'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/80">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[var(--gold)]"
                >
                  <MessageCircle className="size-3.5" />
                  {client.phone}
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  {client.phone}
                </span>
              )}
              {client.email ? (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="size-3.5" />
                  {client.email}
                </span>
              ) : null}
              {cpf ? (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  CPF: <span className="font-mono text-foreground/80">{cpf}</span>
                </span>
              ) : null}
              {instagram ? (
                <a
                  href={`https://instagram.com/${instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-[var(--gold)]"
                >
                  <AtSign className="size-3.5" />
                  {instagram.startsWith('@') ? instagram : `@${instagram}`}
                </a>
              ) : null}
              {client.skin_phototype ? (
                <Badge
                  variant="outline"
                  className="border-[var(--gold)]/40 bg-[var(--gold)]/10 text-foreground"
                >
                  Fototipo {client.skin_phototype}
                </Badge>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {criticalAlerts.length > 0 ? (
        <Card
          variant="premium"
          className="border-0 bg-gradient-to-br from-red-50 to-amber-50 ring-1 ring-red-200"
        >
          <CardContent className="flex flex-col gap-3 px-6 py-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-600" strokeWidth={2} />
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-red-700">
                Avisos clínicos críticos
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              {criticalAlerts.map((alert, idx) => (
                <li
                  key={idx}
                  className={cn(
                    'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
                    alert.level === 'high'
                      ? 'border-red-300 bg-red-100/60 text-red-900'
                      : 'border-amber-300 bg-amber-100/60 text-amber-900',
                  )}
                >
                  <span
                    className={cn(
                      'mt-1 inline-block size-2 shrink-0 rounded-full',
                      alert.level === 'high' ? 'bg-red-600' : 'bg-amber-500',
                    )}
                    aria-hidden
                  />
                  <span className="leading-snug">{alert.text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : ficha.formId ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-emerald-200">
          <CardContent className="flex items-center gap-3 px-6 py-4">
            <CheckCircle2 className="size-5 text-emerald-600" />
            <p className="text-sm text-emerald-800">
              Sem avisos clínicos críticos identificados na ficha.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
        <CardContent className="flex flex-col gap-3 px-6 py-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[var(--gold)]" />
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Tipo de pele (Fitzpatrick)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PHOTOTYPES.map((type) => {
              const isActive = client.skin_phototype === type;
              return (
                <button
                  key={type}
                  type="button"
                  disabled={pending}
                  onClick={() => handleSkinTypeChange(isActive ? null : type)}
                  className={cn(
                    'inline-flex h-9 min-w-12 items-center justify-center rounded-md border px-3 text-sm font-medium uppercase tracking-wider transition-colors',
                    isActive
                      ? 'border-[var(--gold)] bg-[var(--gold)] text-ink'
                      : 'border-cream-dark bg-card text-foreground/70 hover:border-[var(--gold)]/60 hover:text-foreground',
                    pending && 'opacity-60',
                  )}
                  aria-pressed={isActive}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {water || sleep || food || activity || supplements ? (
        <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
          <CardContent className="flex flex-col gap-3 px-6 py-5">
            <div className="flex items-center gap-2">
              <Droplets className="size-4 text-[var(--gold)]" />
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Estilo de vida
              </p>
            </div>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {water ? <Stat label="Hidratação" value={water} /> : null}
              {sleep ? <Stat label="Sono" value={sleep} /> : null}
              {food ? <Stat label="Alimentação" value={food} /> : null}
              {activity ? <Stat label="Atividade física" value={activity} /> : null}
              {supplements ? <Stat label="Suplementos" value={supplements} /> : null}
            </dl>
          </CardContent>
        </Card>
      ) : null}

      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)]">
        <CardContent className="flex flex-col gap-3 px-6 py-5">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-[var(--gold)]" />
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Histórico financeiro
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <FinancialStat label="Atendimentos" value={String(completed.length)} />
            <FinancialStat label="Total gasto" value={formatCurrency(totalSpent)} />
            <FinancialStat label="Ticket médio" value={formatCurrency(ticket)} />
            <FinancialStat
              label="Última visita"
              value={lastVisit ? formatDate(lastVisit.performed_at, 'short') : '—'}
              icon={lastVisit ? <Calendar className="size-3.5" /> : null}
            />
          </div>
          {lastVisit?.procedure_name ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <History className="size-3" />
              Último procedimento: {lastVisit.procedure_name}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function FinancialStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-cream-dark bg-cream/40 px-3 py-2.5">
      <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span className="inline-flex items-center gap-1 font-serif text-base font-medium text-foreground">
        {icon}
        {value}
      </span>
    </div>
  );
}
