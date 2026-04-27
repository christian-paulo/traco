import 'server-only';

import { createClient } from '@/lib/supabase/server';

import {
  countAppointmentsThisMonth,
  countClientsToRecover,
  getMonthlyRevenue,
} from './appointments';

export type DashboardStats = {
  totalClients: number;
  monthlyAppointments: number;
  monthlyRevenue: number;
  clientsToRecover: number;
};

export async function getDashboardStats(_tenantId: string): Promise<DashboardStats> {
  void _tenantId;
  const supabase = await createClient();

  const [{ count: totalClients }, monthlyAppointments, monthlyRevenue, clientsToRecover] =
    await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      countAppointmentsThisMonth(),
      getMonthlyRevenue(),
      countClientsToRecover(),
    ]);

  return {
    totalClients: totalClients ?? 0,
    monthlyAppointments,
    monthlyRevenue,
    clientsToRecover,
  };
}
