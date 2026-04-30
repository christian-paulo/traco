import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type NoteRow = {
  id: string;
  client_id: string;
  appointment_id: string | null;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export async function listClientNotes(clientId: string): Promise<NoteRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('professional_notes')
    .select('id, client_id, appointment_id, title, content, pinned, created_at, updated_at')
    .eq('client_id', clientId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as NoteRow[];
}
