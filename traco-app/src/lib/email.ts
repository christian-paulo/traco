import 'server-only';

import { Resend } from 'resend';
import type { ReactElement } from 'react';

import AnamnesisCompletedClientEmail from '@/emails/anamnesis-completed-client';
import AnamnesisCompletedDesignerEmail from '@/emails/anamnesis-completed-designer';
import AnamnesisInviteEmail from '@/emails/anamnesis-invite';

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL;

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

type SendEmailParams = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  replyTo?: string;
};

export async function sendEmail({ to, subject, react, replyTo }: SendEmailParams) {
  if (!fromEmail) {
    throw new Error('RESEND_FROM_EMAIL não configurada.');
  }

  const client = getClient();
  return client.emails.send({
    from: `Traço <${fromEmail}>`,
    to,
    subject,
    react,
    replyTo,
  });
}

export async function sendAnamnesisInvite(params: {
  to: string;
  clientName: string;
  designerName: string;
  formUrl: string;
}) {
  return sendEmail({
    to: params.to,
    subject: 'Sua ficha de anamnese — Traço',
    react: AnamnesisInviteEmail({
      clientName: params.clientName,
      designerName: params.designerName,
      formUrl: params.formUrl,
    }),
  });
}

export async function sendAnamnesisCompletedClient(params: {
  to: string;
  clientName: string;
  pdfUrl?: string;
  designerName: string;
}) {
  return sendEmail({
    to: params.to,
    subject: 'Sua ficha foi recebida ✓',
    react: AnamnesisCompletedClientEmail({
      clientName: params.clientName,
      pdfUrl: params.pdfUrl,
      designerName: params.designerName,
    }),
  });
}

export async function sendAnamnesisCompletedDesigner(params: {
  to: string;
  clientName: string;
  designerName: string;
  criticalAnswers: Array<{ label: string; value: string }>;
  pdfUrl?: string;
  clientProfileUrl: string;
}) {
  return sendEmail({
    to: params.to,
    subject: `Nova ficha assinada — ${params.clientName}`,
    react: AnamnesisCompletedDesignerEmail({
      clientName: params.clientName,
      designerName: params.designerName,
      criticalAnswers: params.criticalAnswers,
      pdfUrl: params.pdfUrl,
      clientProfileUrl: params.clientProfileUrl,
    }),
  });
}
