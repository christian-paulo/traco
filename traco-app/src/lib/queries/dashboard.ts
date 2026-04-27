import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type DashboardStats = {
  totalClients: number;
  monthlyAppointments: number;
  monthlyRevenue: number;
  clientsToRecover: number;
};

export async function getDashboardStats(tenantId: string): Promise<DashboardStats> {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartIso = monthStart.toISOString();

  const todayIso = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    .toISOString()
    .slice(0, 10);

  const [clientsResult, appointmentsThisMonth, allAppointments] = await Promise.all([
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase
      .from('appointments')
      .select('id, price', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('performed_at', monthStartIso),
    supabase
      .from('appointments')
      .select('client_id, performed_at, return_due_date')
      .eq('tenant_id', tenantId)
      .order('performed_at', { ascending: false }),
  ]);

  const totalClients = clientsResult.count ?? 0;
  const monthlyAppointments = appointmentsThisMonth.count ?? 0;
  const monthlyRevenue = (appointmentsThisMonth.data ?? []).reduce(
    (sum, row) => sum + Number(row.price ?? 0),
    0,
  );

  const seen = new Set<string>();
  let clientsToRecover = 0;
  for (const row of allAppointments.data ?? []) {
    if (seen.has(row.client_id)) continue;
    seen.add(row.client_id);
    if (row.return_due_date && row.return_due_date < todayIso) {
      clientsToRecover += 1;
    }
  }

  return {
    totalClients,
    monthlyAppointments,
    monthlyRevenue,
    clientsToRecover,
  };
}
