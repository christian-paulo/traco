import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type ClientRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  birth_date: string | null;
  skin_phototype: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type FichaStatus = 'none' | 'pending' | 'expired' | 'signed';

export type ClientWithLastVisit = ClientRow & {
  last_visit_at: string | null;
  ficha_status: FichaStatus;
};

export const PAGE_SIZE = 50;

type ListParams = {
  search?: string;
  tag?: string;
  page?: number;
};

export async function listClients({
  search,
  tag,
  page = 1,
}: ListParams = {}): Promise<{ rows: ClientWithLastVisit[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search && search.trim()) {
    const term = search.trim();
    query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  if (tag && tag.trim()) {
    query = query.contains('tags', [tag.trim()]);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const ids = (data ?? []).map((c) => c.id);
  const lastVisitMap = new Map<string, string>();
  const fichaStatusMap = new Map<string, FichaStatus>();
  if (ids.length > 0) {
    const [{ data: appts }, { data: fichas }] = await Promise.all([
      supabase
        .from('appointments')
        .select('client_id, performed_at')
        .in('client_id', ids)
        .order('performed_at', { ascending: false }),
      supabase
        .from('anamnesis_forms')
        .select('client_id, status, expires_at, created_at')
        .in('client_id', ids)
        .order('created_at', { ascending: false }),
    ]);
    for (const a of appts ?? []) {
      if (!lastVisitMap.has(a.client_id)) {
        lastVisitMap.set(a.client_id, a.performed_at);
      }
    }
    const now = Date.now();
    for (const f of fichas ?? []) {
      const cid = f.client_id as string;
      const current = fichaStatusMap.get(cid);
      // Signed sempre vence
      if (current === 'signed') continue;
      if (f.status === 'signed') {
        fichaStatusMap.set(cid, 'signed');
        continue;
      }
      if (f.status === 'expired') {
        if (!current) fichaStatusMap.set(cid, 'expired');
        continue;
      }
      if (f.status === 'pending') {
        const expired = new Date(f.expires_at as string).getTime() < now;
        if (expired) {
          if (current !== 'pending') fichaStatusMap.set(cid, 'expired');
        } else {
          fichaStatusMap.set(cid, 'pending');
        }
      }
    }
  }

  const rows: ClientWithLastVisit[] = (data ?? []).map((c) => ({
    ...(c as ClientRow),
    last_visit_at: lastVisitMap.get(c.id) ?? null,
    ficha_status: fichaStatusMap.get(c.id) ?? 'none',
  }));

  return { rows, total: count ?? 0 };
}

export async function countClients(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true });
  return count ?? 0;
}

export type ClientDetail = ClientRow & {
  recent_appointments: Array<{
    id: string;
    performed_at: string;
    price: number;
    procedure: { id: string; name: string; color: string } | null;
  }>;
};

export async function getClientById(id: string): Promise<ClientDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;

  const { data: appts } = await supabase
    .from('appointments')
    .select('id, performed_at, price, procedures(id, name, color)')
    .eq('client_id', id)
    .order('performed_at', { ascending: false })
    .limit(5);

  const recent = (appts ?? []).map((a) => ({
    id: a.id as string,
    performed_at: a.performed_at as string,
    price: Number(a.price ?? 0),
    procedure: Array.isArray(a.procedures)
      ? (a.procedures[0] as { id: string; name: string; color: string } | undefined) ?? null
      : ((a.procedures as { id: string; name: string; color: string } | null) ?? null),
  }));

  return { ...(data as ClientRow), recent_appointments: recent };
}

export type ClientToRecover = {
  client_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  last_appointment_date: string;
  last_appointment_id: string;
  last_procedure_id: string | null;
  last_procedure_name: string | null;
  last_procedure_color: string | null;
  last_procedure_default_price: number;
  return_due_date: string;
  days_overdue: number;
  last_recovery_email_sent_at: string | null;
};

export async function getClientsToRecover(): Promise<ClientToRecover[]> {
  const supabase = await createClient();

  const { data: appts } = await supabase
    .from('appointments')
    .select(
      'id, client_id, performed_at, return_due_date, procedure_id, procedures(id, name, color, default_price)',
    )
    .order('performed_at', { ascending: false });

  type ApptRow = {
    id: string;
    client_id: string;
    performed_at: string;
    return_due_date: string | null;
    procedure_id: string | null;
    procedures:
      | { id: string; name: string; color: string; default_price: number }
      | { id: string; name: string; color: string; default_price: number }[]
      | null;
  };

  const seen = new Set<string>();
  const overdue: ApptRow[] = [];
  const todayIso = new Date().toISOString().slice(0, 10);

  for (const raw of appts ?? []) {
    const row = raw as unknown as ApptRow;
    if (seen.has(row.client_id)) continue;
    seen.add(row.client_id);
    if (row.return_due_date && row.return_due_date < todayIso) overdue.push(row);
  }

  if (overdue.length === 0) return [];

  const ids = overdue.map((r) => r.client_id);
  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name, phone, email, last_recovery_email_sent_at')
    .in('id', ids);
  const clientMap = new Map((clients ?? []).map((c) => [c.id, c]));

  const today = new Date(`${todayIso}T00:00:00Z`);
  return overdue
    .map((row) => {
      const client = clientMap.get(row.client_id);
      if (!client) return null;
      const proc = Array.isArray(row.procedures)
        ? row.procedures[0]
        : (row.procedures ?? null);
      const dueDate = new Date(`${row.return_due_date as string}T00:00:00Z`);
      const days = Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000);
      return {
        client_id: client.id,
        full_name: client.full_name,
        phone: client.phone,
        email: client.email,
        last_appointment_date: row.performed_at,
        last_appointment_id: row.id,
        last_procedure_id: row.procedure_id,
        last_procedure_name: proc?.name ?? null,
        last_procedure_color: proc?.color ?? null,
        last_procedure_default_price: Number(proc?.default_price ?? 0),
        return_due_date: row.return_due_date as string,
        days_overdue: days,
        last_recovery_email_sent_at: client.last_recovery_email_sent_at ?? null,
      } satisfies ClientToRecover;
    })
    .filter((v): v is ClientToRecover => v !== null)
    .sort((a, b) => b.days_overdue - a.days_overdue);
}

export async function listAllTags(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('clients').select('tags');
  const set = new Set<string>();
  for (const row of data ?? []) {
    for (const t of row.tags ?? []) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
