'use client';

import { Loader2 } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDateTimeShort } from '@/lib/format';
import type { PublicService } from '@/lib/queries/public-booking';
import { digitsOnly, formatPhoneBR } from '@/lib/utils/phone';
import { createPublicBookingDraft } from '@/server/actions/booking';

import type { BookingDetailsForm } from './booking-flow';

type Props = {
  slug: string;
  service: PublicService;
  scheduledStartIso: string;
  details: BookingDetailsForm;
  onChange: (next: BookingDetailsForm) => void;
  onConfirmed: (payload: {
    scheduledFormatted: string;
    scheduledIso: string;
    procedureName: string;
    finalPrice: number;
  }) => void;
};

const REFERRAL_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'google', label: 'Google' },
  { value: 'cliente_atual', label: 'Já sou cliente' },
  { value: 'outro', label: 'Outro' },
];

export function StepDetails({
  slug,
  service,
  scheduledStartIso,
  details,
  onChange,
  onConfirmed,
}: Props) {
  const [pending, startTransition] = useTransition();
  const finalPrice = Number(service.custom_price ?? service.procedure.default_price);

  const isValid =
    details.full_name.trim().length >= 3 &&
    digitsOnly(details.phone).length >= 10 &&
    details.consent &&
    (details.email.trim() === '' || /\S+@\S+\.\S+/.test(details.email.trim()));

  function update<K extends keyof BookingDetailsForm>(key: K, value: BookingDetailsForm[K]) {
    onChange({ ...details, [key]: value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || pending) return;
    startTransition(async () => {
      const result = await createPublicBookingDraft({
        slug,
        procedure_id: service.procedure_id,
        scheduled_start_at: scheduledStartIso,
        client: {
          full_name: details.full_name.trim(),
          phone: details.phone,
          email: details.email.trim() || null,
          birth_date: details.birth_date || null,
          notes: details.notes.trim() || null,
          referral_source: details.referral_source || null,
          consent: true,
        },
      });
      if (result.success) {
        toast.success('Solicitação enviada.');
        onConfirmed({
          scheduledFormatted: formatDateTimeShort(scheduledStartIso),
          scheduledIso: scheduledStartIso,
          procedureName: service.procedure.name,
          finalPrice,
        });
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Confirmar agendamento
        </h1>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {formatDateTimeShort(scheduledStartIso)} · {service.procedure.name} ·{' '}
          {formatCurrency(finalPrice)}
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-cream-dark bg-card p-5 shadow-sm">
        <Field
          label="Nome completo"
          required
          value={details.full_name}
          onChange={(v) => update('full_name', v)}
          placeholder="Como você quer ser chamada?"
          disabled={pending}
        />

        <Field
          label="Celular / WhatsApp"
          required
          value={details.phone}
          onChange={(v) => update('phone', formatPhoneBR(v))}
          placeholder="(11) 99999-9999"
          inputMode="tel"
          disabled={pending}
        />

        <Field
          label="Email (opcional)"
          value={details.email}
          onChange={(v) => update('email', v)}
          placeholder="seuemail@exemplo.com"
          type="email"
          inputMode="email"
          disabled={pending}
        />

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Data de nascimento (opcional)
          </Label>
          <Input
            type="date"
            value={details.birth_date}
            onChange={(e) => update('birth_date', e.target.value)}
            disabled={pending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Como conheceu o studio? (opcional)
          </Label>
          <Select
            value={details.referral_source || undefined}
            onValueChange={(v) => update('referral_source', v ?? '')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {REFERRAL_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Observações (opcional)
          </Label>
          <Textarea
            value={details.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Algo que devemos saber? Primeira vez? Alergias? Preferências?"
            rows={3}
            maxLength={500}
            disabled={pending}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-cream-dark bg-cream/40 px-3 py-2.5">
          <input
            type="checkbox"
            checked={details.consent}
            onChange={(e) => update('consent', e.target.checked)}
            className="mt-0.5 size-4 cursor-pointer accent-[var(--gold)]"
            required
          />
          <span className="text-xs text-foreground">
            Aceito que meus dados sejam usados para confirmar o agendamento e enviar
            comunicações relacionadas.
          </span>
        </label>
      </div>

      <Button
        variant="premium"
        size="xl"
        type="submit"
        disabled={!isValid || pending}
        className="w-full"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Confirmar agendamento
      </Button>
    </form>
  );
}

function Field({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  disabled,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-[var(--gold)]">*</span> : null}
      </Label>
      <Input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
