import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type RevenueOverview = {
  totalRevenue: number;
  totalAppointments: number;
  averageTicket: number;
  byProcedure: Array<{
    procedure_id: string;
    name: string;
    color: string;
    revenue: number;
    count: number;
    percentage: number;
  }>;
  topProcedure: { name: string; percentage: number } | null;
};

type RangeArgs = { from: string; to: string };

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getRevenueOverview({ from, to }: RangeArgs): Promise<RevenueOverview> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('id, price, procedure_id, procedures(id, name, color)')
    .gte('performed_at', from)
    .lte('performed_at', to);
  if (error) throw error;

  let totalRevenue = 0;
  const byProc = new Map<
    string,
    { name: string; color: string; revenue: number; count: number }
  >();
  for (const row of data ?? []) {
    const price = Number(row.price ?? 0);
    totalRevenue += price;
    const proc = pickOne(
      row.procedures as
        | { id: string; name: string; color: string }
        | { id: string; name: string; color: string }[]
        | null,
    );
    if (proc) {
      const current = byProc.get(proc.id) ?? {
        name: proc.name,
        color: proc.color,
        revenue: 0,
        count: 0,
      };
      current.revenue += price;
      current.count += 1;
      byProc.set(proc.id, current);
    }
  }

  const totalAppointments = (data ?? []).length;
  const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

  const byProcedure = Array.from(byProc.entries())
    .map(([procedure_id, v]) => ({
      procedure_id,
      name: v.name,
      color: v.color,
      revenue: v.revenue,
      count: v.count,
      percentage: totalRevenue > 0 ? (v.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const top = byProcedure[0] ?? null;

  return {
    totalRevenue,
    totalAppointments,
    averageTicket,
    byProcedure,
    topProcedure: top ? { name: top.name, percentage: top.percentage } : null,
  };
}

export async function getMonthlyRevenueComparison(
  months = 6,
): Promise<Array<{ month: string; label: string; revenue: number; appointments: number }>> {
  const supabase = await createClient();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const startIso = start.toISOString();

  const { data } = await supabase
    .from('appointments')
    .select('performed_at, price')
    .gte('performed_at', startIso);

  const buckets = new Map<string, { revenue: number; appointments: number }>();
  for (let i = 0; i < months; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, { revenue: 0, appointments: 0 });
  }

  for (const row of data ?? []) {
    const d = new Date(row.performed_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.revenue += Number(row.price ?? 0);
      bucket.appointments += 1;
    }
  }

  const labelFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' });
  return Array.from(buckets.entries()).map(([month, v]) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    const formatted = labelFmt.format(d).replace('.', '');
    return {
      month,
      label: formatted.replace(/^(\w)/, (c) => c.toUpperCase()),
      revenue: v.revenue,
      appointments: v.appointments,
    };
  });
}

export type TopClient = {
  client_id: string;
  full_name: string;
  total_revenue: number;
  appointments_count: number;
  last_visit: string | null;
};

export async function getTopClients(
  options: { limit?: number; from?: string; to?: string } = {},
): Promise<TopClient[]> {
  const { limit = 10, from, to } = options;
  const supabase = await createClient();

  let query = supabase.from('appointments').select('client_id, performed_at, price');
  if (from) query = query.gte('performed_at', from);
  if (to) query = query.lte('performed_at', to);
  const { data: appts } = await query;

  const map = new Map<string, { revenue: number; count: number; lastVisit: string | null }>();
  for (const row of appts ?? []) {
    const current = map.get(row.client_id) ?? { revenue: 0, count: 0, lastVisit: null };
    current.revenue += Number(row.price ?? 0);
    current.count += 1;
    if (!current.lastVisit || row.performed_at > current.lastVisit) {
      current.lastVisit = row.performed_at;
    }
    map.set(row.client_id, current);
  }

  const sorted = Array.from(map.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, limit);

  if (sorted.length === 0) return [];

  const ids = sorted.map(([id]) => id);
  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name')
    .in('id', ids);
  const nameMap = new Map((clients ?? []).map((c) => [c.id, c.full_name]));

  return sorted.map(([client_id, v]) => ({
    client_id,
    full_name: nameMap.get(client_id) ?? 'Cliente',
    total_revenue: v.revenue,
    appointments_count: v.count,
    last_visit: v.lastVisit,
  }));
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export async function getRevenueByDayOfWeek({ from, to }: RangeArgs): Promise<
  Array<{ dayOfWeek: number; label: string; revenue: number; appointments: number }>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('appointments')
    .select('performed_at, price')
    .gte('performed_at', from)
    .lte('performed_at', to);

  const buckets: Array<{ revenue: number; appointments: number }> = Array.from(
    { length: 7 },
    () => ({ revenue: 0, appointments: 0 }),
  );

  for (const row of data ?? []) {
    const day = new Date(row.performed_at).getDay();
    buckets[day].revenue += Number(row.price ?? 0);
    buckets[day].appointments += 1;
  }

  // Reordena para começar em segunda-feira
  const order = [1, 2, 3, 4, 5, 6, 0];
  return order.map((dayOfWeek) => ({
    dayOfWeek,
    label: DAY_LABELS[dayOfWeek],
    revenue: buckets[dayOfWeek].revenue,
    appointments: buckets[dayOfWeek].appointments,
  }));
}

export async function getRevenueComparison({
  from,
  to,
}: RangeArgs): Promise<{ current: number; previous: number; deltaPct: number | null }> {
  const supabase = await createClient();
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffMs = toDate.getTime() - fromDate.getTime();
  const prevTo = new Date(fromDate.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - diffMs);

  const [{ data: cur }, { data: prev }] = await Promise.all([
    supabase
      .from('appointments')
      .select('price')
      .gte('performed_at', from)
      .lte('performed_at', to),
    supabase
      .from('appointments')
      .select('price')
      .gte('performed_at', prevFrom.toISOString())
      .lte('performed_at', prevTo.toISOString()),
  ]);

  const current = (cur ?? []).reduce((s, r) => s + Number(r.price ?? 0), 0);
  const previous = (prev ?? []).reduce((s, r) => s + Number(r.price ?? 0), 0);
  const deltaPct = previous > 0 ? ((current - previous) / previous) * 100 : null;

  return { current, previous, deltaPct };
}
