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

export type ClientWithLastVisit = ClientRow & {
  last_visit_at: string | null;
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
  let lastVisitMap = new Map<string, string>();
  if (ids.length > 0) {
    const { data: appts } = await supabase
      .from('appointments')
      .select('client_id, performed_at')
      .in('client_id', ids)
      .order('performed_at', { ascending: false });
    for (const a of appts ?? []) {
      if (!lastVisitMap.has(a.client_id)) {
        lastVisitMap.set(a.client_id, a.performed_at);
      }
    }
  }

  const rows: ClientWithLastVisit[] = (data ?? []).map((c) => ({
    ...(c as ClientRow),
    last_visit_at: lastVisitMap.get(c.id) ?? null,
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

export async function listAllTags(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('clients').select('tags');
  const set = new Set<string>();
  for (const row of data ?? []) {
    for (const t of row.tags ?? []) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
