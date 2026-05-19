import 'server-only';

import webpush from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? 'mailto:contato@traco.app';

let configured = false;

export function isPushConfigured(): boolean {
  return Boolean(publicKey && privateKey);
}

export function getVapidPublicKey(): string | null {
  return publicKey ?? null;
}

function ensureConfigured() {
  if (!isPushConfigured()) {
    throw new Error('Push notifications não configuradas (VAPID keys ausentes).');
  }
  if (!configured) {
    webpush.setVapidDetails(subject, publicKey!, privateKey!);
    configured = true;
  }
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export type PushSubscriptionRecord = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth_secret: string;
};

/**
 * Envia um push pra um subscription. Retorna sucesso ou descreve o erro.
 * Se o endpoint estiver morto (410 Gone), o caller deve desativar a sub.
 */
export async function sendPush(
  sub: PushSubscriptionRecord,
  payload: PushPayload,
): Promise<{ ok: true } | { ok: false; gone: boolean; error: string }> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth_secret },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 },
    );
    return { ok: true };
  } catch (err: unknown) {
    const status =
      typeof err === 'object' && err !== null && 'statusCode' in err
        ? (err as { statusCode: number }).statusCode
        : 0;
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, gone: status === 404 || status === 410, error: message };
  }
}
