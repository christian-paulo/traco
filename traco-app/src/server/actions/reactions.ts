'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';

type SimpleResult = { success: true } | { success: false; error: string };

const REACTION_TYPES = [
  'allergy',
  'irritation',
  'hypersensitivity',
  'positive_excellent',
  'below_expected',
  'other',
] as const;

const OCCURRED_WHEN = [
  'during',
  'immediately_after',
  '24_72h_after',
  'late_1week_plus',
] as const;

const STATUSES = ['active', 'resolved', 'observation'] as const;

const reactionSchema = z.object({
  client_id: z.string().uuid(),
  appointment_id: z.string().uuid().nullable().optional(),
  reaction_type: z.enum(REACTION_TYPES),
  occurred_when: z.enum(OCCURRED_WHEN),
  symptoms: z.string().trim().min(3, 'Descreva os sintomas.').max(2000),
  treatment: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  status: z.enum(STATUSES).default('observation'),
  notes: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type ReactionInput = z.input<typeof reactionSchema>;

export async function createReaction(input: ReactionInput): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const parsed = reactionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('client_reactions').insert({
    tenant_id: profile.tenantId,
    client_id: parsed.data.client_id,
    appointment_id: parsed.data.appointment_id ?? null,
    reaction_type: parsed.data.reaction_type,
    occurred_when: parsed.data.occurred_when,
    symptoms: parsed.data.symptoms,
    treatment: parsed.data.treatment,
    status: parsed.data.status,
    notes: parsed.data.notes,
    photo_urls: [],
    created_by: profile.id,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath(`/dashboard/clientes/${parsed.data.client_id}`);
  if (parsed.data.appointment_id) {
    revalidatePath(`/dashboard/atendimento/${parsed.data.appointment_id}`);
  }
  return { success: true };
}

export async function updateReactionStatus(
  id: string,
  newStatus: 'active' | 'resolved' | 'observation',
): Promise<SimpleResult> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from('client_reactions')
    .update({ status: newStatus })
    .eq('id', id)
    .select('client_id, appointment_id')
    .single();
  if (error) return { success: false, error: error.message };
  if (row?.client_id) revalidatePath(`/dashboard/clientes/${row.client_id}`);
  if (row?.appointment_id)
    revalidatePath(`/dashboard/atendimento/${row.appointment_id}`);
  return { success: true };
}

export async function deleteReaction(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('client_reactions')
    .select('client_id, appointment_id')
    .eq('id', id)
    .maybeSingle();
  const { error } = await supabase.from('client_reactions').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  if (existing?.client_id) revalidatePath(`/dashboard/clientes/${existing.client_id}`);
  if (existing?.appointment_id)
    revalidatePath(`/dashboard/atendimento/${existing.appointment_id}`);
  return { success: true };
}
