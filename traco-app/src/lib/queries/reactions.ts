import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type ReactionType =
  | 'allergy'
  | 'irritation'
  | 'hypersensitivity'
  | 'positive_excellent'
  | 'below_expected'
  | 'other';

export type ReactionStatus = 'active' | 'resolved' | 'observation';

export type ReactionWhen = 'during' | 'immediately_after' | '24_72h_after' | 'late_1week_plus';

export type ReactionRow = {
  id: string;
  client_id: string;
  appointment_id: string | null;
  reaction_type: ReactionType;
  occurred_when: ReactionWhen;
  symptoms: string;
  treatment: string | null;
  status: ReactionStatus;
  photo_urls: string[];
  notes: string | null;
  recorded_at: string;
  created_at: string;
};

export async function listClientReactions(
  clientId: string,
  status?: ReactionStatus,
): Promise<ReactionRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from('client_reactions')
    .select(
      'id, client_id, appointment_id, reaction_type, occurred_when, symptoms, treatment, status, photo_urls, notes, recorded_at, created_at',
    )
    .eq('client_id', clientId)
    .order('recorded_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ReactionRow[];
}

export async function countActiveReactionsByClient(clientId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('client_reactions')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('status', 'active');
  return count ?? 0;
}
