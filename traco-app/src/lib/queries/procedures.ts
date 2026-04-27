import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type ProcedureRow = {
  id: string;
  name: string;
  default_price: number;
  default_return_days: number;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function listProcedures(includeInactive = true): Promise<ProcedureRow[]> {
  const supabase = await createClient();
  let query = supabase.from('procedures').select('*').order('name', { ascending: true });
  if (!includeInactive) {
    query = query.eq('is_active', true);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row as ProcedureRow),
    default_price: Number(row.default_price ?? 0),
  }));
}
