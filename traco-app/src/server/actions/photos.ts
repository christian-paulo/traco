'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SIGNED_URL_TTL = 60 * 60;

type SimpleResult = { success: true } | { success: false; error: string };
type CreateResult =
  | { success: true; data: { id: string; storage_path: string; signed_url: string | null } }
  | { success: false; error: string };

function genId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function uploadPhoto(formData: FormData): Promise<CreateResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const file = formData.get('file');
  const clientId = String(formData.get('clientId') ?? '');
  const procedureId = formData.get('procedureId') ? String(formData.get('procedureId')) : null;
  const notes = formData.get('notes') ? String(formData.get('notes')) : null;
  const isKeyPhoto = formData.get('isKeyPhoto') === 'true';

  if (!(file instanceof File)) {
    return { success: false, error: 'Arquivo inválido.' };
  }
  if (!clientId) {
    return { success: false, error: 'Cliente não informada.' };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { success: false, error: 'Tipo de arquivo não suportado.' };
  }
  if (file.size > MAX_BYTES) {
    return { success: false, error: 'Imagem maior que 5MB.' };
  }

  const supabase = await createClient();

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const objectId = genId();
  const path = `${profile.tenantId}/${clientId}/${objectId}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(path, new Uint8Array(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: row, error: insertError } = await supabase
    .from('photos')
    .insert({
      tenant_id: profile.tenantId,
      client_id: clientId,
      storage_path: path,
      procedure_id: procedureId,
      taken_at: new Date().toISOString(),
      notes,
      is_key_photo: isKeyPhoto,
    })
    .select('id, storage_path')
    .single();

  if (insertError || !row) {
    await supabase.storage.from('photos').remove([path]);
    return { success: false, error: insertError?.message ?? 'Erro ao salvar foto.' };
  }

  const { data: signed } = await supabase.storage
    .from('photos')
    .createSignedUrl(path, SIGNED_URL_TTL);

  revalidatePath(`/dashboard/clientes/${clientId}`);
  return {
    success: true,
    data: {
      id: row.id,
      storage_path: row.storage_path,
      signed_url: signed?.signedUrl ?? null,
    },
  };
}

export async function updatePhoto(
  id: string,
  data: { notes?: string | null; is_key_photo?: boolean; procedure_id?: string | null },
): Promise<SimpleResult> {
  const supabase = await createClient();
  const update: {
    notes?: string | null;
    is_key_photo?: boolean;
    procedure_id?: string | null;
  } = {};
  if ('notes' in data) update.notes = data.notes ?? null;
  if ('is_key_photo' in data && data.is_key_photo !== undefined) {
    update.is_key_photo = data.is_key_photo;
  }
  if ('procedure_id' in data) update.procedure_id = data.procedure_id ?? null;

  const { data: row, error } = await supabase
    .from('photos')
    .update(update)
    .eq('id', id)
    .select('client_id')
    .single();

  if (error) return { success: false, error: error.message };
  if (row?.client_id) revalidatePath(`/dashboard/clientes/${row.client_id}`);
  return { success: true };
}

export async function deletePhoto(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { data: photo } = await supabase
    .from('photos')
    .select('client_id, storage_path')
    .eq('id', id)
    .maybeSingle();

  if (!photo) {
    return { success: false, error: 'Foto não encontrada.' };
  }

  await supabase.storage.from('photos').remove([photo.storage_path]);
  const { error } = await supabase.from('photos').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  if (photo.client_id) revalidatePath(`/dashboard/clientes/${photo.client_id}`);
  return { success: true };
}

export async function getSignedPhotoUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from('photos')
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}
