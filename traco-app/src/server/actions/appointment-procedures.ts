'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database';

type SimpleResult = { success: true } | { success: false; error: string };

const productSchema = z.object({
  brand: z.string().trim().min(1).max(80),
  product: z.string().trim().min(1).max(120),
  lot: z.string().trim().max(60).optional(),
  expiry: z.string().trim().max(20).optional(),
  step_time: z.number().int().nonnegative().max(180).optional(),
  category: z.string().trim().max(40).optional(),
});

const stepSchema = z.object({
  step_name: z.string().trim().min(1).max(80),
  minutes: z.number().int().min(0).max(180),
});

const upsertSchema = z.object({
  appointment_id: z.string().uuid(),
  products_used: z.array(productSchema).default([]),
  step_times: z.array(stepSchema).default([]),
  technique: z.string().trim().max(2000).nullable().optional(),
  technical_notes: z.string().trim().max(2000).nullable().optional(),
});

export type UpsertProcedureInput = z.input<typeof upsertSchema>;

export async function upsertAppointmentProcedure(
  input: UpsertProcedureInput,
): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const parsed = upsertSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('appointment_procedures').upsert(
    {
      tenant_id: profile.tenantId,
      appointment_id: parsed.data.appointment_id,
      products_used: parsed.data.products_used as unknown as Json,
      step_times: parsed.data.step_times as unknown as Json,
      technique: parsed.data.technique ?? null,
      technical_notes: parsed.data.technical_notes ?? null,
    },
    { onConflict: 'appointment_id' },
  );
  if (error) return { success: false, error: error.message };
  revalidatePath(`/dashboard/atendimento/${parsed.data.appointment_id}`);
  return { success: true };
}

const favoriteSchema = z.object({
  brand: z.string().trim().min(1).max(80),
  product: z.string().trim().min(1).max(120),
  category: z
    .enum(['reduction', 'neutralization', 'hydration', 'henna', 'tint', 'other'])
    .optional(),
  default_step_time: z.number().int().min(0).max(180).optional(),
});

export type FavoriteInput = z.input<typeof favoriteSchema>;

export async function saveFavoriteProduct(input: FavoriteInput): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const parsed = favoriteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('favorite_products').insert({
    tenant_id: profile.tenantId,
    brand: parsed.data.brand,
    product: parsed.data.product,
    category: parsed.data.category ?? null,
    default_step_time: parsed.data.default_step_time ?? null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function incrementFavoriteUseCount(productId: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('favorite_products')
    .select('use_count')
    .eq('id', productId)
    .maybeSingle();
  if (!existing) return { success: false, error: 'Produto não encontrado.' };
  const { error } = await supabase
    .from('favorite_products')
    .update({ use_count: existing.use_count + 1 })
    .eq('id', productId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
