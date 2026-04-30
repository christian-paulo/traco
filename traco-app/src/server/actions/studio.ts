'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getCurrentProfessional, getCurrentStudio } from '@/lib/queries/studio';
import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';

type SimpleResult = { success: true } | { success: false; error: string };

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen.');

const studioSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema,
  address: z.string().trim().max(200).nullable().optional(),
  bio: z.string().trim().max(280).nullable().optional(),
  cover_image_url: z.string().trim().nullable().optional(),
});

const bookingPolicySchema = z.object({
  waitlist_enabled: z.boolean(),
  booking_buffer_minutes: z.number().int().min(0).max(60),
});

const professionalSchema = z.object({
  display_name: z.string().trim().min(2).max(60),
  role_title: z.string().trim().max(80).nullable().optional(),
  bio: z.string().trim().max(280).nullable().optional(),
  avatar_url: z.string().trim().nullable().optional(),
});

const workingHourSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  is_active: z.boolean(),
});

const timeOffSchema = z.object({
  start_at: z.string().min(1),
  end_at: z.string().min(1),
  reason: z.string().trim().max(120).nullable().optional(),
  is_recurring: z.boolean().optional(),
});

const professionalServiceSchema = z.object({
  procedure_id: z.string().uuid(),
  duration_minutes: z.number().int().min(5).max(480),
  custom_price: z.number().nonnegative().nullable().optional(),
  is_active: z.boolean().optional(),
});

export async function updateStudio(input: z.input<typeof studioSchema>): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const parsed = studioSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const supabase = await createClient();
  const studio = await getCurrentStudio();
  if (!studio) return { success: false, error: 'Studio não encontrado.' };

  const { error } = await supabase
    .from('studios')
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      address: parsed.data.address ?? null,
      bio: parsed.data.bio ?? null,
      cover_image_url: parsed.data.cover_image_url ?? null,
    })
    .eq('id', studio.id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}

export async function updateBookingPolicy(
  input: z.input<typeof bookingPolicySchema>,
): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const parsed = bookingPolicySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const studio = await getCurrentStudio();
  if (!studio) return { success: false, error: 'Studio não encontrado.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('studios')
    .update({
      waitlist_enabled: parsed.data.waitlist_enabled,
      booking_buffer_minutes: parsed.data.booking_buffer_minutes,
    })
    .eq('id', studio.id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}

export async function updateProfessional(
  input: z.input<typeof professionalSchema>,
): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const parsed = professionalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const professional = await getCurrentProfessional();
  if (!professional) return { success: false, error: 'Profissional não encontrado.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('professionals')
    .update({
      display_name: parsed.data.display_name,
      role_title: parsed.data.role_title ?? null,
      bio: parsed.data.bio ?? null,
      avatar_url: parsed.data.avatar_url ?? null,
    })
    .eq('id', professional.id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}

export async function replaceWorkingHours(
  hours: Array<z.input<typeof workingHourSchema>>,
): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const parsed = z.array(workingHourSchema).length(7).safeParse(hours);
  if (!parsed.success) {
    return { success: false, error: 'Configure os 7 dias da semana.' };
  }
  const professional = await getCurrentProfessional();
  if (!professional) return { success: false, error: 'Profissional não encontrado.' };

  const supabase = await createClient();
  // Apaga e reinsere — solo, são poucas linhas
  await supabase.from('working_hours').delete().eq('professional_id', professional.id);
  const rows = parsed.data.map((h) => ({
    tenant_id: profile.tenantId,
    professional_id: professional.id,
    day_of_week: h.day_of_week,
    start_time: h.start_time,
    end_time: h.end_time,
    is_active: h.is_active,
  }));
  const { error } = await supabase.from('working_hours').insert(rows);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/dashboard/agenda');
  return { success: true };
}

export async function addTimeOff(input: z.input<typeof timeOffSchema>): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const parsed = timeOffSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Dados inválidos.' };
  const professional = await getCurrentProfessional();
  if (!professional) return { success: false, error: 'Profissional não encontrado.' };

  const supabase = await createClient();
  const { error } = await supabase.from('time_off').insert({
    tenant_id: profile.tenantId,
    professional_id: professional.id,
    start_at: new Date(parsed.data.start_at).toISOString(),
    end_at: new Date(parsed.data.end_at).toISOString(),
    reason: parsed.data.reason ?? null,
    is_recurring: parsed.data.is_recurring ?? false,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/dashboard/agenda');
  return { success: true };
}

export async function removeTimeOff(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('time_off').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/dashboard/agenda');
  return { success: true };
}

export async function upsertProfessionalService(
  input: z.input<typeof professionalServiceSchema>,
): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const parsed = professionalServiceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const professional = await getCurrentProfessional();
  if (!professional) return { success: false, error: 'Profissional não encontrado.' };

  const supabase = await createClient();
  const { error } = await supabase.from('professional_services').upsert(
    {
      tenant_id: profile.tenantId,
      professional_id: professional.id,
      procedure_id: parsed.data.procedure_id,
      duration_minutes: parsed.data.duration_minutes,
      custom_price: parsed.data.custom_price ?? null,
      is_active: parsed.data.is_active ?? true,
    },
    { onConflict: 'professional_id,procedure_id' },
  );
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}
