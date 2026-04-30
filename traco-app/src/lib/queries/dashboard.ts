import 'server-only';

import { createClient } from '@/lib/supabase/server';

import {
  countAppointmentsThisMonth,
  countClientsToRecover,
  getMonthlyRevenue,
} from './appointments';

export type ActiveReactionSummary = {
  id: string;
  client_id: string;
  client_name: string;
  reaction_type: string;
  recorded_at: string;
  symptoms: string;
  status: 'active' | 'observation';
};

export type TodayAppointmentSummary = {
  id: string;
  client_id: string;
  client_name: string;
  procedure_name: string;
  procedure_color: string;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  status: string;
  price: number;
  has_active_reaction: boolean;
};

export type PinnedNoteSummary = {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  content: string;
  created_at: string;
};

export async function getActiveReactionsSummary(limit = 3): Promise<{
  total: number;
  recent: ActiveReactionSummary[];
}> {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from('client_reactions')
    .select('id, client_id, reaction_type, recorded_at, symptoms, status, clients(full_name)', {
      count: 'exact',
    })
    .in('status', ['active', 'observation'])
    .order('recorded_at', { ascending: false });

  type Raw = {
    id: string;
    client_id: string;
    reaction_type: string;
    recorded_at: string;
    symptoms: string;
    status: string;
    clients: { full_name: string } | { full_name: string }[] | null;
  };
  const recent = (data ?? []).slice(0, limit).map((raw) => {
    const r = raw as unknown as Raw;
    const client = Array.isArray(r.clients) ? r.clients[0] : r.clients;
    return {
      id: r.id,
      client_id: r.client_id,
      client_name: client?.full_name ?? 'Cliente',
      reaction_type: r.reaction_type,
      recorded_at: r.recorded_at,
      symptoms: r.symptoms,
      status: r.status as 'active' | 'observation',
    } satisfies ActiveReactionSummary;
  });
  return { total: count ?? recent.length, recent };
}

export async function getTodayAppointments(): Promise<TodayAppointmentSummary[]> {
  const supabase = await createClient();
  const now = new Date();
  const dayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0),
  ).toISOString();
  const dayEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59),
  ).toISOString();

  const { data } = await supabase
    .from('appointments')
    .select(
      'id, client_id, scheduled_start_at, scheduled_end_at, status, price, clients(full_name), procedures(name, color)',
    )
    .gte('scheduled_start_at', dayStart)
    .lte('scheduled_start_at', dayEnd)
    .order('scheduled_start_at', { ascending: true });

  type Raw = {
    id: string;
    client_id: string;
    scheduled_start_at: string | null;
    scheduled_end_at: string | null;
    status: string;
    price: number | null;
    clients: { full_name: string } | { full_name: string }[] | null;
    procedures: { name: string; color: string } | { name: string; color: string }[] | null;
  };
  const list = (data ?? []).map((raw) => {
    const r = raw as unknown as Raw;
    const c = Array.isArray(r.clients) ? r.clients[0] : r.clients;
    const p = Array.isArray(r.procedures) ? r.procedures[0] : r.procedures;
    return {
      id: r.id,
      client_id: r.client_id,
      client_name: c?.full_name ?? 'Cliente',
      procedure_name: p?.name ?? 'Procedimento',
      procedure_color: p?.color ?? '#C9A961',
      scheduled_start_at: r.scheduled_start_at,
      scheduled_end_at: r.scheduled_end_at,
      status: r.status,
      price: Number(r.price ?? 0),
      has_active_reaction: false,
    } satisfies TodayAppointmentSummary;
  });

  if (list.length === 0) return list;

  const clientIds = Array.from(new Set(list.map((a) => a.client_id)));
  const { data: reactRows } = await supabase
    .from('client_reactions')
    .select('client_id')
    .eq('status', 'active')
    .in('client_id', clientIds);
  const withReaction = new Set((reactRows ?? []).map((r) => r.client_id as string));

  return list.map((a) => ({ ...a, has_active_reaction: withReaction.has(a.client_id) }));
}

export async function getPinnedNotesRecent(limit = 5): Promise<PinnedNoteSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('professional_notes')
    .select('id, client_id, title, content, created_at, clients(full_name)')
    .eq('pinned', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  type Raw = {
    id: string;
    client_id: string;
    title: string;
    content: string;
    created_at: string;
    clients: { full_name: string } | { full_name: string }[] | null;
  };
  return (data ?? []).map((raw) => {
    const r = raw as unknown as Raw;
    const c = Array.isArray(r.clients) ? r.clients[0] : r.clients;
    return {
      id: r.id,
      client_id: r.client_id,
      client_name: c?.full_name ?? 'Cliente',
      title: r.title,
      content: r.content,
      created_at: r.created_at,
    } satisfies PinnedNoteSummary;
  });
}

export async function getClientsWithActiveReactionIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('client_reactions')
    .select('client_id')
    .eq('status', 'active');
  return new Set((data ?? []).map((r) => r.client_id as string));
}

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
