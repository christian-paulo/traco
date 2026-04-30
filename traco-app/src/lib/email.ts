import 'server-only';

import { Resend } from 'resend';
import type { ReactElement } from 'react';

import AnamnesisCompletedClientEmail from '@/emails/anamnesis-completed-client';
import AnamnesisCompletedDesignerEmail from '@/emails/anamnesis-completed-designer';
import AnamnesisInviteEmail from '@/emails/anamnesis-invite';
import BookingConfirmedClientEmail from '@/emails/booking-confirmed-client';
import BookingDraftClientEmail from '@/emails/booking-draft-client';
import BookingDraftDesignerEmail from '@/emails/booking-draft-designer';
import BookingRejectedClientEmail from '@/emails/booking-rejected-client';
import PostAttendanceEmail from '@/emails/post-attendance';
import RecoveryInviteEmail from '@/emails/recovery-invite';

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

let cachedClient: Resend | null = null;

function getClient(): Resend {
  if (!apiKey) {
    throw new Error('RESEND_API_KEY não configurada.');
  }
  if (!cachedClient) {
    cachedClient = new Resend(apiKey);
  }
  return cachedClient;
}

export type EmailResult = { success: true; id?: string } | { success: false; error: string };

type SendEmailParams = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
};

async function rawSend(params: SendEmailParams, label: string): Promise<EmailResult> {
  try {
    console.log(`[Email] ${label} → tentando enviar para:`, params.to);
    if (!apiKey) {
      console.error('[Email] RESEND_API_KEY não configurada.');
      return { success: false, error: 'RESEND_API_KEY não configurada.' };
    }
    const client = getClient();
    const result = await client.emails.send({
      from: `Traço <${fromEmail}>`,
      to: params.to,
      subject: params.subject,
      react: params.react,
      replyTo: params.replyTo,
    });

    const apiError = (result as { error?: unknown }).error;
    if (apiError) {
      console.error(`[Email] ${label} → Resend retornou erro:`, apiError);
      return {
        success: false,
        error: typeof apiError === 'string' ? apiError : JSON.stringify(apiError),
      };
    }

    const id = (result as { data?: { id?: string } | null }).data?.id;
    console.log(`[Email] ${label} → enviado com sucesso, id:`, id);
    return { success: true, id };
  } catch (err) {
    console.error(`[Email] ${label} → exceção:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido ao enviar email.',
    };
  }
}

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  return rawSend(params, 'sendEmail');
}

export async function sendAnamnesisInvite(params: {
  to: string;
  clientName: string;
  designerName: string;
  formUrl: string;
}): Promise<EmailResult> {
  return rawSend(
    {
      to: params.to,
      subject: `${params.designerName} te enviou uma ficha de anamnese`,
      react: AnamnesisInviteEmail({
        clientName: params.clientName,
        designerName: params.designerName,
        formUrl: params.formUrl,
      }),
    },
    'anamnesis-invite',
  );
}

export async function sendAnamnesisCompletedClient(params: {
  to: string;
  clientName: string;
  pdfUrl?: string;
  designerName: string;
}): Promise<EmailResult> {
  return rawSend(
    {
      to: params.to,
      subject: 'Sua ficha foi recebida ✓',
      react: AnamnesisCompletedClientEmail({
        clientName: params.clientName,
        pdfUrl: params.pdfUrl,
        designerName: params.designerName,
      }),
    },
    'anamnesis-completed-client',
  );
}

export async function sendAnamnesisCompletedDesigner(params: {
  to: string;
  clientName: string;
  designerName: string;
  criticalAnswers: Array<{ label: string; value: string }>;
  pdfUrl?: string;
  clientProfileUrl: string;
}): Promise<EmailResult> {
  return rawSend(
    {
      to: params.to,
      subject: `Nova ficha assinada — ${params.clientName}`,
      react: AnamnesisCompletedDesignerEmail({
        clientName: params.clientName,
        designerName: params.designerName,
        criticalAnswers: params.criticalAnswers,
        pdfUrl: params.pdfUrl,
        clientProfileUrl: params.clientProfileUrl,
      }),
    },
    'anamnesis-completed-designer',
  );
}

export async function sendBookingDraftDesignerEmail(params: {
  to: string;
  designerFirstName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  scheduledFormatted: string;
  procedureName: string;
  clientNotes: string | null;
  panelUrl: string;
}): Promise<EmailResult> {
  return rawSend(
    {
      to: params.to,
      subject: `Novo agendamento solicitado por ${params.clientName}`,
      react: BookingDraftDesignerEmail({
        designerFirstName: params.designerFirstName,
        clientName: params.clientName,
        clientPhone: params.clientPhone,
        clientEmail: params.clientEmail,
        scheduledFormatted: params.scheduledFormatted,
        procedureName: params.procedureName,
        clientNotes: params.clientNotes,
        panelUrl: params.panelUrl,
      }),
    },
    'booking-draft-designer',
  );
}

export async function sendBookingDraftClientEmail(params: {
  to: string;
  clientName: string;
  designerName: string;
  studioName: string;
  scheduledFormatted: string;
  procedureName: string;
}): Promise<EmailResult> {
  return rawSend(
    {
      to: params.to,
      subject: 'Recebemos sua solicitação de agendamento',
      react: BookingDraftClientEmail({
        clientName: params.clientName,
        designerName: params.designerName,
        studioName: params.studioName,
        scheduledFormatted: params.scheduledFormatted,
        procedureName: params.procedureName,
      }),
    },
    'booking-draft-client',
  );
}

export async function sendBookingConfirmedClientEmail(params: {
  to: string;
  clientName: string;
  designerName: string;
  studioName: string;
  studioAddress: string | null;
  scheduledFormatted: string;
  procedureName: string;
}): Promise<EmailResult> {
  return rawSend(
    {
      to: params.to,
      subject: `Seu agendamento foi confirmado por ${params.designerName}`,
      react: BookingConfirmedClientEmail({
        clientName: params.clientName,
        designerName: params.designerName,
        studioName: params.studioName,
        studioAddress: params.studioAddress,
        scheduledFormatted: params.scheduledFormatted,
        procedureName: params.procedureName,
      }),
    },
    'booking-confirmed-client',
  );
}

export async function sendBookingRejectedClientEmail(params: {
  to: string;
  clientName: string;
  designerName: string;
  studioName: string;
  scheduledFormatted: string;
  procedureName: string;
  reason: string | null;
  bookingUrl: string;
}): Promise<EmailResult> {
  return rawSend(
    {
      to: params.to,
      subject: 'Sua solicitação não pôde ser atendida',
      react: BookingRejectedClientEmail({
        clientName: params.clientName,
        designerName: params.designerName,
        studioName: params.studioName,
        scheduledFormatted: params.scheduledFormatted,
        procedureName: params.procedureName,
        reason: params.reason,
        bookingUrl: params.bookingUrl,
      }),
    },
    'booking-rejected-client',
  );
}

export async function sendPostAttendanceEmail(params: {
  to: string;
  clientName: string;
  designerName: string;
  procedureName: string;
  performedDate: string;
  finalPrice: string;
  returnDate: string | null;
  postCareNotes: string[];
}): Promise<EmailResult> {
  return rawSend(
    {
      to: params.to,
      subject: 'Obrigada pela visita ao Traço',
      react: PostAttendanceEmail({
        clientName: params.clientName,
        designerName: params.designerName,
        procedureName: params.procedureName,
        performedDate: params.performedDate,
        finalPrice: params.finalPrice,
        returnDate: params.returnDate,
        postCareNotes: params.postCareNotes,
      }),
    },
    'post-attendance',
  );
}

export async function sendRecoveryEmail(params: {
  to: string;
  clientName: string;
  designerName: string;
  lastProcedure: string;
  daysOverdue: number;
  whatsappUrl: string;
}): Promise<EmailResult> {
  return rawSend(
    {
      to: params.to,
      subject: `${params.clientName.split(' ')[0]}, hora de renovar seu ${params.lastProcedure}`,
      react: RecoveryInviteEmail({
        clientName: params.clientName,
        designerName: params.designerName,
        lastProcedure: params.lastProcedure,
        daysOverdue: params.daysOverdue,
        whatsappUrl: params.whatsappUrl,
      }),
    },
    'recovery-invite',
  );
}
