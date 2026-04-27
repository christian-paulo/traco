import 'server-only';

import { createClient } from '@/lib/supabase/server';

export type PhotoRow = {
  id: string;
  client_id: string;
  storage_path: string;
  procedure_id: string | null;
  taken_at: string;
  notes: string | null;
  is_key_photo: boolean;
  created_at: string;
  procedure: { id: string; name: string; color: string } | null;
};

export type PhotoWithUrl = PhotoRow & {
  signed_url: string | null;
};

const SIGNED_URL_TTL = 60 * 60; // 1 hora

type RawPhoto = {
  id: string;
  client_id: string;
  storage_path: string;
  procedure_id: string | null;
  taken_at: string;
  notes: string | null;
  is_key_photo: boolean;
  created_at: string;
  procedures:
    | { id: string; name: string; color: string }
    | { id: string; name: string; color: string }[]
    | null;
};

function pickOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listPhotosByClient(
  clientId: string,
  onlyKey = false,
): Promise<PhotoWithUrl[]> {
  const supabase = await createClient();
  let query = supabase
    .from('photos')
    .select(
      'id, client_id, storage_path, procedure_id, taken_at, notes, is_key_photo, created_at, procedures(id, name, color)',
    )
    .eq('client_id', clientId)
    .order('taken_at', { ascending: false });
  if (onlyKey) query = query.eq('is_key_photo', true);

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []).map((raw) => {
    const r = raw as unknown as RawPhoto;
    return {
      id: r.id,
      client_id: r.client_id,
      storage_path: r.storage_path,
      procedure_id: r.procedure_id,
      taken_at: r.taken_at,
      notes: r.notes,
      is_key_photo: r.is_key_photo,
      created_at: r.created_at,
      procedure: pickOne(r.procedures),
    } satisfies PhotoRow;
  });

  // Gera signed URLs em batch
  const paths = rows.map((r) => r.storage_path);
  let signedMap = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from('photos')
      .createSignedUrls(paths, SIGNED_URL_TTL);
    if (signed) {
      for (const item of signed) {
        if (item.path && item.signedUrl) signedMap.set(item.path, item.signedUrl);
      }
    }
  }

  return rows.map((r) => ({ ...r, signed_url: signedMap.get(r.storage_path) ?? null }));
}
