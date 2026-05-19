import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import { isPushConfigured, sendPush } from '@/lib/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COMPLETED_STATUSES = ['completed', 'confirmed', 'pending'];

/**
 * Vercel Cron diário às 7h.
 * Pra cada designer com push habilitado, calcula retornos atrasados +
 * próximos da semana e envia notificação (se houver algo a comunicar).
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado.' }, { status: 500 });
  }
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({
      skipped: true,
      reason: 'VAPID keys ausentes',
    });
  }

  const supabase = createAdminClient();

  // Busca todas subscriptions ativas agrupadas por user
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, tenant_id, endpoint, p256dh, auth_secret')
    .eq('enabled', true);

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'sem subscriptions' });
  }

  // Agrupa por tenant pra fazer 1 query de retornos por tenant em vez de N
  const tenantIds = Array.from(new Set(subs.map((s) => s.tenant_id)));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const tenantSummary = new Map<string, { overdue: number; upcoming: number }>();

  for (const tenantId of tenantIds) {
    const { data: appts } = await supabase
      .from('appointments')
      .select(
        'client_id, performed_at, return_due_date, procedures(default_return_days)',
      )
      .eq('tenant_id', tenantId)
      .in('status', COMPLETED_STATUSES)
      .order('performed_at', { ascending: false });

    type ApptRow = {
      client_id: string;
      performed_at: string;
      return_due_date: string | null;
      procedures:
        | { default_return_days: number }
        | { default_return_days: number }[]
        | null;
    };

    const seen = new Set<string>();
    let overdue = 0;
    let upcoming = 0;
    const sevenDaysAheadMs = todayMs + 7 * 86_400_000;

    for (const raw of ((appts ?? []) as unknown as ApptRow[])) {
      if (seen.has(raw.client_id)) continue;
      seen.add(raw.client_id);

      let expectedMs: number | null = null;
      if (raw.return_due_date) {
        expectedMs = new Date(`${raw.return_due_date}T00:00:00`).getTime();
      } else {
        const proc = Array.isArray(raw.procedures) ? raw.procedures[0] : raw.procedures;
        if (proc?.default_return_days) {
          expectedMs =
            new Date(raw.performed_at).getTime() + proc.default_return_days * 86_400_000;
        }
      }
      if (expectedMs === null) continue;
      if (expectedMs < todayMs) overdue += 1;
      else if (expectedMs <= sevenDaysAheadMs) upcoming += 1;
    }

    tenantSummary.set(tenantId, { overdue, upcoming });
  }

  // Envia push por subscription
  let sent = 0;
  let skipped = 0;
  let dead = 0;
  for (const sub of subs) {
    const summary = tenantSummary.get(sub.tenant_id) ?? { overdue: 0, upcoming: 0 };
    if (summary.overdue === 0 && summary.upcoming === 0) {
      skipped += 1;
      continue;
    }

    const title =
      summary.overdue > 0
        ? `${summary.overdue} ${summary.overdue === 1 ? 'cliente atrasada' : 'clientes atrasadas'} 💛`
        : `${summary.upcoming} ${summary.upcoming === 1 ? 'retorno' : 'retornos'} esta semana`;
    const body =
      summary.overdue > 0 && summary.upcoming > 0
        ? `+ ${summary.upcoming} ${summary.upcoming === 1 ? 'cliente' : 'clientes'} pra contatar nos próximos 7 dias`
        : 'Toca pra ver quem contatar primeiro';

    const result = await sendPush(
      {
        id: sub.id,
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth_secret: sub.auth_secret,
      },
      {
        title,
        body,
        url: '/dashboard/clientes?filtro=retornos',
        tag: 'daily-returns',
      },
    );

    if (result.ok) {
      sent += 1;
      await supabase
        .from('push_subscriptions')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('id', sub.id);
    } else if (result.gone) {
      dead += 1;
      await supabase.from('push_subscriptions').delete().eq('id', sub.id);
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, dead });
}
