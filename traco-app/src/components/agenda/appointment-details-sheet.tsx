'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Briefcase,
  Clock,
  ExternalLink,
  MessageSquare,
  Pencil,
  Phone,
  Play,
  Trash2,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import type { AgendaAppointment } from '@/components/agenda/agenda-day-view';
import { WhatsappTemplatePicker } from '@/components/agenda/whatsapp-template-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/format';
import type { MessageTemplateRow } from '@/lib/queries/message-templates';
import { cn } from '@/lib/utils';
import type { MessageTemplateCategory } from '@/lib/validations/message-template';
import { buildAppointmentVars } from '@/lib/whatsapp';
import { updateAppointmentStatus } from '@/server/actions/appointments';

type Props = {
  appointment: AgendaAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (apt: AgendaAppointment) => void;
  messageTemplates: MessageTemplateRow[];
  designerName: string | null;
  studioName: string | null;
  studioAddress: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

export function AppointmentDetailsSheet({
  appointment,
  open,
  onOpenChange,
  onEdit,
  messageTemplates,
  designerName,
  studioName,
  studioAddress,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!appointment) return null;

  const apt = appointment;
  const startDate = new Date(apt.scheduled_start_at);
  const endDate = new Date(apt.scheduled_end_at);
  const dateLabel = format(startDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    .replace(/^(\w)/, (c) => c.toUpperCase());
  const timeRange = `${format(startDate, 'HH:mm')} – ${format(endDate, 'HH:mm')}`;

  const isCancelled = apt.status === 'cancelled' || apt.status === 'no_show';
  const isCompleted = apt.status === 'completed';
  const canStart = !isCancelled && !isCompleted;
  const canCancel = !isCancelled && !isCompleted;
  const statusLabel = STATUS_LABELS[apt.status] ?? apt.status;

  // Categoria do template muda conforme o status do agendamento
  const templateCategory: MessageTemplateCategory = isCompleted ? 'aftercare' : 'reminder';
  const categoryTemplates = messageTemplates.filter(
    (t) => t.category === templateCategory,
  );

  const vars = buildAppointmentVars({
    clientFullName: apt.client_name,
    procedureName: apt.procedure_name,
    scheduledStartAt: apt.scheduled_start_at,
    price: apt.price,
    designerName,
    studioName,
    studioAddress,
  });

  function handleCancel() {
    if (!canCancel) return;
    if (!confirm('Cancelar este agendamento? A cliente não será avisada automaticamente.')) {
      return;
    }
    startTransition(async () => {
      const result = await updateAppointmentStatus(apt.id, 'cancelled');
      if (result.success) {
        toast.success('Agendamento cancelado.');
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Erro ao cancelar.');
      }
    });
  }

  function handleWhatsappClick() {
    if (!apt.client_phone) {
      toast.error('Cliente sem telefone cadastrado.');
      return;
    }
    setPickerOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="sr-only">Detalhes do agendamento</DialogTitle>
        <DialogBody className="px-0 py-0">
          <div className="grid grid-cols-4 gap-1 border-b border-cream-dark/60 px-4 py-4">
            <ActionButton
              icon={<MessageSquare className="size-5" />}
              label="WhatsApp"
              variant="whatsapp"
              onClick={handleWhatsappClick}
              disabled={pending || !apt.client_phone}
            />
            <ActionButton
              icon={<Pencil className="size-5" />}
              label="Editar"
              variant="neutral"
              onClick={() => onEdit(apt)}
              disabled={pending}
            />
            <ActionButton
              icon={<Play className="size-5 fill-current" />}
              label="Iniciar"
              variant="gold"
              asLink
              href={canStart ? `/atendimento/${apt.id}` : undefined}
              disabled={!canStart || pending}
            />
            <ActionButton
              icon={<X className="size-5" />}
              label="Cancelar"
              variant="danger"
              onClick={handleCancel}
              disabled={!canCancel || pending}
            />
          </div>

          <div className="flex flex-col gap-4 px-6 py-5">
            <DetailRow icon={<Clock className="size-4" />} label={timeRange} sub={dateLabel}>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]',
                  isCancelled
                    ? 'bg-red-100 text-red-700'
                    : isCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-[var(--gold)]/15 text-[var(--gold)]',
                )}
              >
                {statusLabel}
              </span>
            </DetailRow>

            <DetailRow
              icon={<User className="size-4" />}
              label={apt.client_name}
              sub={apt.client_phone || 'Sem telefone'}
            />

            <DetailRow
              icon={<Briefcase className="size-4" />}
              label={apt.procedure_name}
              sub={formatCurrency(apt.price)}
            >
              <span
                aria-hidden
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: apt.procedure_color }}
              />
            </DetailRow>

            {apt.notes ? (
              <DetailRow
                icon={<MessageSquare className="size-4" />}
                label="Observação"
                sub={apt.notes}
              />
            ) : null}

            {!apt.client_phone ? (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
                <Phone className="mr-1 inline size-3" /> Cliente sem telefone — adicione no perfil
                pra enviar mensagens.
              </p>
            ) : null}

            <Link
              href={`/dashboard/clientes/${apt.client_id}`}
              className="mt-2 inline-flex items-center gap-1.5 self-start text-xs font-medium text-[var(--gold)] hover:underline"
            >
              Ver perfil completo da cliente
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </DialogBody>
      </DialogContent>

      <WhatsappTemplatePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        templates={categoryTemplates}
        category={templateCategory}
        phone={apt.client_phone}
        vars={vars}
      />
    </Dialog>
  );
}

type ActionVariant = 'whatsapp' | 'gold' | 'neutral' | 'danger';

type ActionButtonProps = {
  icon: React.ReactNode;
  label: string;
  variant: ActionVariant;
  onClick?: () => void;
  href?: string;
  asLink?: boolean;
  disabled?: boolean;
};

function ActionButton({
  icon,
  label,
  variant,
  onClick,
  href,
  asLink,
  disabled,
}: ActionButtonProps) {
  const variantClass = {
    whatsapp: 'bg-emerald-500 text-white hover:bg-emerald-600',
    gold: 'bg-[var(--gold)] text-ink hover:bg-[var(--gold)]/90',
    neutral: 'bg-cream text-foreground hover:bg-cream-dark',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100',
  }[variant];

  const baseClass =
    'flex h-auto min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

  if (asLink && href && !disabled) {
    return (
      <Link href={href} className={cn(baseClass, variantClass)} aria-label={label}>
        {icon}
        <span className="leading-none">{label}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(baseClass, variantClass)}
      aria-label={label}
    >
      {icon}
      <span className="leading-none">{label}</span>
    </button>
  );
}

type DetailRowProps = {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  children?: React.ReactNode;
};

function DetailRow({ icon, label, sub, children }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-cream text-muted-foreground">
        {icon}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-medium leading-tight text-foreground">{label}</p>
        {sub ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{sub}</p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}
