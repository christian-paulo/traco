'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';

type SimpleResult = { success: true } | { success: false; error: string };

const noteSchema = z.object({
  client_id: z.string().uuid(),
  appointment_id: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1, 'Título obrigatório.').max(120),
  content: z.string().trim().min(1, 'Conteúdo obrigatório.').max(2000),
});

export type NoteInput = z.input<typeof noteSchema>;

export async function createNote(input: NoteInput): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('professional_notes').insert({
    tenant_id: profile.tenantId,
    client_id: parsed.data.client_id,
    appointment_id: parsed.data.appointment_id ?? null,
    title: parsed.data.title,
    content: parsed.data.content,
    created_by: profile.id,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath(`/dashboard/clientes/${parsed.data.client_id}`);
  if (parsed.data.appointment_id) {
    revalidatePath(`/dashboard/atendimento/${parsed.data.appointment_id}`);
  }
  return { success: true };
}

export async function updateNote(
  id: string,
  data: { title?: string; content?: string },
): Promise<SimpleResult> {
  const supabase = await createClient();
  const update: { title?: string; content?: string } = {};
  if (data.title !== undefined) update.title = data.title.trim();
  if (data.content !== undefined) update.content = data.content.trim();
  const { data: row, error } = await supabase
    .from('professional_notes')
    .update(update)
    .eq('id', id)
    .select('client_id, appointment_id')
    .single();
  if (error) return { success: false, error: error.message };
  if (row?.client_id) revalidatePath(`/dashboard/clientes/${row.client_id}`);
  if (row?.appointment_id) revalidatePath(`/dashboard/atendimento/${row.appointment_id}`);
  return { success: true };
}

export async function toggleNotePin(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('professional_notes')
    .select('pinned, client_id, appointment_id')
    .eq('id', id)
    .maybeSingle();
  if (!existing) return { success: false, error: 'Nota não encontrada.' };
  const { error } = await supabase
    .from('professional_notes')
    .update({ pinned: !existing.pinned })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  if (existing.client_id) revalidatePath(`/dashboard/clientes/${existing.client_id}`);
  if (existing.appointment_id)
    revalidatePath(`/dashboard/atendimento/${existing.appointment_id}`);
  return { success: true };
}

export async function deleteNote(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('professional_notes')
    .select('client_id, appointment_id')
    .eq('id', id)
    .maybeSingle();
  const { error } = await supabase.from('professional_notes').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  if (existing?.client_id) revalidatePath(`/dashboard/clientes/${existing.client_id}`);
  if (existing?.appointment_id)
    revalidatePath(`/dashboard/atendimento/${existing.appointment_id}`);
  return { success: true };
}
