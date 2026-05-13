import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type ClientReportType = 'revenue' | 'appointments';

export type ClientRankingRow = {
  rank: number;
  clientId: string;
  fullName: string;
  value: number; // currency for 'revenue', count for 'appointments'
  appointmentsCount: number;
};

export type ClientsReport = {
  range: { from: string; to: string };
  type: ClientReportType;
  totalClients: number;
  newClientsInPeriod: number;
  ranking: ClientRankingRow[];
};

const COMPLETED_STATUSES = ['completed', 'confirmed', 'pending'];
const RANK_LIMIT = 30;

export async function getClientsReport(
  fromIso: string,
  toIso: string,
  type: ClientReportType = 'revenue',
): Promise<ClientsReport> {
  const supabase = await createClient();

  const [totalResult, newResult, apptsResult] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    supabase
      .from('appointments')
      .select('client_id, price, clients(full_name)')
      .gte('performed_at', fromIso)
      .lte('performed_at', toIso)
      .in('status', COMPLETED_STATUSES),
  ]);

  const totalClients = totalResult.count ?? 0;
  const newClientsInPeriod = newResult.count ?? 0;
  const rows = apptsResult.data ?? [];

  type RawClient = { full_name: string };
  type Raw = {
    client_id: string | null;
    price: number | null;
    clients: RawClient | RawClient[] | null;
  };

  const byClient = new Map<
    string,
    { fullName: string; revenue: number; count: number }
  >();

  for (const raw of rows as unknown as Raw[]) {
    if (!raw.client_id) continue;
    const clientField = Array.isArray(raw.clients)
      ? (raw.clients[0] ?? null)
      : raw.clients;
    const fullName = clientField?.full_name ?? 'Cliente';
    const current = byClient.get(raw.client_id) ?? {
      fullName,
      revenue: 0,
      count: 0,
    };
    current.revenue += Number(raw.price ?? 0);
    current.count += 1;
    byClient.set(raw.client_id, current);
  }

  const sortKey = (entry: { revenue: number; count: number }) =>
    type === 'revenue' ? entry.revenue : entry.count;

  const ranking: ClientRankingRow[] = Array.from(byClient.entries())
    .map(([clientId, data]) => ({
      clientId,
      fullName: data.fullName,
      revenue: data.revenue,
      count: data.count,
    }))
    .filter((c) => sortKey(c) > 0)
    .sort((a, b) => sortKey(b) - sortKey(a))
    .slice(0, RANK_LIMIT)
    .map((c, idx) => ({
      rank: idx + 1,
      clientId: c.clientId,
      fullName: c.fullName,
      value: type === 'revenue' ? c.revenue : c.count,
      appointmentsCount: c.count,
    }));

  return {
    range: { from: fromIso, to: toIso },
    type,
    totalClients,
    newClientsInPeriod,
    ranking,
  };
}
