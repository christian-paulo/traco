import 'server-only';

import { Resend } from 'resend';
import type { ReactElement } from 'react';

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
    from: fromEmail,
    to,
    subject,
    react,
    replyTo,
  });
}
