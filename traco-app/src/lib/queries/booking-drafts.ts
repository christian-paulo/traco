import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type BookingDraftRow = {
  id: string;
  studio_id: string;
  professional_id: string;
  procedure_id: string;
  scheduled_start_at: string;
  client_full_name: string;
  client_phone: string;
  client_email: string | null;
  client_birth_date: string | null;
  client_notes: string | null;
  status: 'pending' | 'confirmed' | 'rejected' | 'expired';
  created_at: string;
  procedure: { id: string; name: string; color: string } | null;
};

type RawDraft = Omit<BookingDraftRow, 'procedure'> & {
  procedures:
    | { id: string; name: string; color: string }
    | { id: string; name: string; color: string }[]
    | null;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listDrafts(
  status: 'pending' | 'confirmed' | 'rejected' | 'expired' = 'pending',
): Promise<BookingDraftRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('booking_drafts')
    .select('*, procedures(id, name, color)')
    .eq('status', status)
    .order('scheduled_start_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((raw) => {
    const r = raw as unknown as RawDraft;
    return {
      ...r,
      procedure: pickOne(r.procedures),
    } satisfies BookingDraftRow;
  });
}

export async function countPendingDrafts(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('booking_drafts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');
  return count ?? 0;
}
