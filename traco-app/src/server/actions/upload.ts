'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentProfile } from '@/lib/queries/profile';
import { getCurrentStudio } from '@/lib/queries/studio';
import { createClient } from '@/lib/supabase/server';

type UploadResult = { success: true; url: string } | { success: false; error: string };
type SimpleResult = { success: true } | { success: false; error: string };

const BUCKET = 'profile-images';

function inferExtension(file: File): string {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export async function uploadProfileAvatar(file: File): Promise<UploadResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();
  const ext = inferExtension(file);
  const path = `${profile.id}/avatar.${ext}`;

  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Atualiza profile.avatar_url
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl.publicUrl })
    .eq('id', profile.id);

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/onboarding');
  return { success: true, url: publicUrl.publicUrl };
}

export async function removeProfileAvatar(): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();

  // Tenta remover do storage (não fatal se já não existir)
  await supabase.storage.from(BUCKET).remove([
    `${profile.id}/avatar.jpg`,
    `${profile.id}/avatar.png`,
    `${profile.id}/avatar.webp`,
  ]);

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', profile.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}

export async function uploadStudioCover(file: File): Promise<UploadResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const studio = await getCurrentStudio();
  if (!studio) return { success: false, error: 'Studio não configurado.' };

  const supabase = await createClient();
  const ext = inferExtension(file);
  const path = `${profile.tenantId}/cover.${ext}`;

  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) return { success: false, error: uploadError.message };

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);

  const { error: updateError } = await supabase
    .from('studios')
    .update({ cover_image_url: publicUrl.publicUrl })
    .eq('id', studio.id);

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/onboarding');
  return { success: true, url: publicUrl.publicUrl };
}

export async function removeStudioCover(): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const studio = await getCurrentStudio();
  if (!studio) return { success: false, error: 'Studio não configurado.' };

  const supabase = await createClient();

  await supabase.storage.from(BUCKET).remove([
    `${profile.tenantId}/cover.jpg`,
    `${profile.tenantId}/cover.png`,
    `${profile.tenantId}/cover.webp`,
  ]);

  const { error } = await supabase
    .from('studios')
    .update({ cover_image_url: null })
    .eq('id', studio.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}
