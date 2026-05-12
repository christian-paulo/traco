import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { formatCurrency } from '@/lib/format';

export type WhatsappTemplateVars = {
  cliente?: string;
  procedimento?: string;
  data?: string;
  hora?: string;
  valor?: string;
  dias?: string;
  designer?: string;
  studio?: string;
  endereco?: string;
};

function firstName(fullName: string | null | undefined): string {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/)[0] ?? '';
}

function digitsOnly(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

export function renderTemplate(
  body: string,
  vars: WhatsappTemplateVars,
): string {
  return body.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = (vars as Record<string, string | undefined>)[key];
    return typeof v === 'string' ? v : '';
  });
}

export function buildWhatsappUrl(
  phone: string | null | undefined,
  message: string,
): string | null {
  const digits = digitsOnly(phone);
  if (!digits) return null;
  const e164 = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}

type AppointmentContextInput = {
  clientFullName: string;
  procedureName: string;
  scheduledStartAt: string;
  price: number;
  designerName?: string | null;
  studioName?: string | null;
  studioAddress?: string | null;
};

export function buildAppointmentVars(
  apt: AppointmentContextInput,
): WhatsappTemplateVars {
  const date = new Date(apt.scheduledStartAt);
  return {
    cliente: firstName(apt.clientFullName),
    procedimento: apt.procedureName,
    data: format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }),
    hora: format(date, 'HH:mm'),
    valor: formatCurrency(apt.price),
    designer: firstName(apt.designerName),
    studio: apt.studioName ?? '',
    endereco: apt.studioAddress ?? '',
  };
}

export const DEFAULT_APPOINTMENT_REMINDER_TEMPLATE =
  'Oi {cliente}! Tudo bem? Confirmando seu {procedimento} {data} às {hora} 💛 Qualquer coisa, me avisa por aqui!';
