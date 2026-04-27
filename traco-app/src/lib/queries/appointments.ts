import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type AppointmentRow = {
  id: string;
  client_id: string;
  procedure_id: string;
  performed_at: string;
  price: number;
  notes: string | null;
  return_due_date: string | null;
  client: { id: string; full_name: string; phone: string } | null;
  procedure: { id: string; name: string; color: string; default_return_days: number } | null;
};

const APPOINTMENT_SELECT =
  'id, client_id, procedure_id, performed_at, price, notes, return_due_date, clients(id, full_name, phone), procedures(id, name, color, default_return_days)';

type RawRow = {
  id: string;
  client_id: string;
  procedure_id: string;
  performed_at: string;
  price: number | string | null;
  notes: string | null;
  return_due_date: string | null;
  clients:
    | { id: string; full_name: string; phone: string }
    | { id: string; full_name: string; phone: string }[]
    | null;
  procedures:
    | { id: string; name: string; color: string; default_return_days: number }
    | { id: string; name: string; color: string; default_return_days: number }[]
    | null;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalize(raw: RawRow): AppointmentRow {
  return {
    id: raw.id,
    client_id: raw.client_id,
    procedure_id: raw.procedure_id,
    performed_at: raw.performed_at,
    price: Number(raw.price ?? 0),
    notes: raw.notes,
    return_due_date: raw.return_due_date,
    client: pickOne(raw.clients),
    procedure: pickOne(raw.procedures),
  };
}

export const APPOINTMENTS_PAGE_SIZE = 50;

type ListParams = {
  procedureId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
};

export async function listAppointments({
  procedureId,
  dateFrom,
  dateTo,
  page = 1,
}: ListParams = {}): Promise<{ rows: AppointmentRow[]; total: number; revenue: number }> {
  const supabase = await createClient();
  const from = (page - 1) * APPOINTMENTS_PAGE_SIZE;
  const to = from + APPOINTMENTS_PAGE_SIZE - 1;

  let query = supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT, { count: 'exact' })
    .order('performed_at', { ascending: false })
    .range(from, to);

  if (procedureId) query = query.eq('procedure_id', procedureId);
  if (dateFrom) query = query.gte('performed_at', dateFrom);
  if (dateTo) query = query.lte('performed_at', dateTo);

  const { data, count, error } = await query;
  if (error) throw error;

  const rows = (data ?? []).map((row) => normalize(row as unknown as RawRow));

  let revenue = 0;
  let revenueQuery = supabase.from('appointments').select('price');
  if (procedureId) revenueQuery = revenueQuery.eq('procedure_id', procedureId);
  if (dateFrom) revenueQuery = revenueQuery.gte('performed_at', dateFrom);
  if (dateTo) revenueQuery = revenueQuery.lte('performed_at', dateTo);
  const { data: revenueRows } = await revenueQuery;
  for (const r of revenueRows ?? []) revenue += Number(r.price ?? 0);

  return { rows, total: count ?? 0, revenue };
}

export async function getAppointmentsByClientId(
  clientId: string,
  limit?: number,
): Promise<AppointmentRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT)
    .eq('client_id', clientId)
    .order('performed_at', { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => normalize(row as unknown as RawRow));
}

export async function countAppointmentsThisMonth(): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .gte('performed_at', monthStart);
  return count ?? 0;
}

export async function getMonthlyRevenue(): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data } = await supabase
    .from('appointments')
    .select('price')
    .gte('performed_at', monthStart);
  return (data ?? []).reduce((sum, r) => sum + Number(r.price ?? 0), 0);
}

export type RevenueByProcedure = {
  procedure_id: string;
  procedure_name: string;
  color: string;
  total_revenue: number;
  count: number;
};

export async function getRevenueByProcedureThisMonth(): Promise<RevenueByProcedure[]> {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data } = await supabase
    .from('appointments')
    .select('procedure_id, price, procedures(id, name, color)')
    .gte('performed_at', monthStart);

  const map = new Map<string, RevenueByProcedure>();
  for (const row of data ?? []) {
    const proc = pickOne(
      row.procedures as
        | { id: string; name: string; color: string }
        | { id: string; name: string; color: string }[]
        | null,
    );
    if (!proc) continue;
    const current = map.get(proc.id) ?? {
      procedure_id: proc.id,
      procedure_name: proc.name,
      color: proc.color,
      total_revenue: 0,
      count: 0,
    };
    current.total_revenue += Number(row.price ?? 0);
    current.count += 1;
    map.set(proc.id, current);
  }
  return Array.from(map.values()).sort((a, b) => b.total_revenue - a.total_revenue);
}

export async function countClientsToRecover(): Promise<number> {
  const supabase = await createClient();
  const todayIso = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('appointments')
    .select('client_id, performed_at, return_due_date')
    .order('performed_at', { ascending: false });
  const seen = new Set<string>();
  let count = 0;
  for (const row of data ?? []) {
    if (seen.has(row.client_id)) continue;
    seen.add(row.client_id);
    if (row.return_due_date && row.return_due_date < todayIso) count += 1;
  }
  return count;
}
