import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type PerformanceMetrics = {
  range: { from: string; to: string };
  revenue: number;
  expenses: number;
  profit: number;
  appointmentsCount: number;
  uniqueClients: number;
  totalMinutes: number;
  daysWithAppointments: number;
  followupsContacted: number;
  followupsScheduled: number;
  conversionRate: number; // 0..1 — scheduled/contacted
};

const COMPLETED_STATUSES = ['completed', 'confirmed', 'pending'];

/**
 * Métricas consolidadas pra tela Performance. Aceita range em ISO datetime
 * (UTC). Considera atendimentos com performed_at no intervalo e status que
 * indique realização (completed/confirmed/pending — exclui cancelled/no_show).
 * Despesas via expenses.date dentro do intervalo (date column, sem timezone).
 *
 * Horas trabalhadas usa scheduled_end_at - scheduled_start_at quando os dois
 * estão preenchidos; caso contrário, fallback de 60 min (atendimentos avulsos
 * sem agendamento prévio não têm duração registrada).
 */
export async function getPerformanceMetrics(
  fromIso: string,
  toIso: string,
): Promise<PerformanceMetrics> {
  const supabase = await createClient();
  const fromDate = fromIso.slice(0, 10);
  const toDate = toIso.slice(0, 10);

  const [appointmentsResult, expensesResult, followupsResult] = await Promise.all([
    supabase
      .from('appointments')
      .select('client_id, performed_at, price, scheduled_start_at, scheduled_end_at, status')
      .gte('performed_at', fromIso)
      .lte('performed_at', toIso)
      .in('status', COMPLETED_STATUSES),
    supabase
      .from('expenses')
      .select('amount')
      .gte('date', fromDate)
      .lte('date', toDate),
    supabase
      .from('client_followups')
      .select('client_id, outcome, contacted_at')
      .gte('contacted_at', fromIso)
      .lte('contacted_at', toIso),
  ]);

  const appointments = appointmentsResult.data ?? [];
  const expenses = expensesResult.data ?? [];
  const followups = followupsResult.data ?? [];

  const revenue = appointments.reduce((sum, a) => sum + Number(a.price ?? 0), 0);
  const expensesTotal = expenses.reduce((sum, e) => sum + Number(e.amount ?? 0), 0);

  const clientSet = new Set<string>();
  const daySet = new Set<string>();
  let totalMinutes = 0;

  for (const a of appointments) {
    if (a.client_id) clientSet.add(a.client_id);
    if (a.performed_at) {
      // Agrupa por data local do tenant — usamos só os 10 chars iso (YYYY-MM-DD)
      daySet.add(a.performed_at.slice(0, 10));
    }
    if (a.scheduled_start_at && a.scheduled_end_at) {
      const start = new Date(a.scheduled_start_at).getTime();
      const end = new Date(a.scheduled_end_at).getTime();
      if (end > start) {
        totalMinutes += Math.round((end - start) / 60_000);
        continue;
      }
    }
    // Fallback: 60 min para atendimentos sem janela registrada
    totalMinutes += 60;
  }

  // Follow-ups: contatadas únicas e quantas marcaram outcome=scheduled
  const contactedClients = new Set<string>();
  const scheduledClients = new Set<string>();
  for (const f of followups as Array<{ client_id: string | null; outcome: string }>) {
    if (!f.client_id) continue;
    contactedClients.add(f.client_id);
    if (f.outcome === 'scheduled') scheduledClients.add(f.client_id);
  }
  const followupsContacted = contactedClients.size;
  const followupsScheduled = scheduledClients.size;
  const conversionRate =
    followupsContacted > 0 ? followupsScheduled / followupsContacted : 0;

  return {
    range: { from: fromIso, to: toIso },
    revenue,
    expenses: expensesTotal,
    profit: revenue - expensesTotal,
    appointmentsCount: appointments.length,
    uniqueClients: clientSet.size,
    totalMinutes,
    daysWithAppointments: daySet.size,
    followupsContacted,
    followupsScheduled,
    conversionRate,
  };
}
