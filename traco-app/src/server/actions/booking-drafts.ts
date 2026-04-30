'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentProfessional, getCurrentStudio } from '@/lib/queries/studio';
import { getCurrentProfile } from '@/lib/queries/profile';
import { formatPhoneBR } from '@/lib/utils/phone';
import { createClient } from '@/lib/supabase/server';

type SimpleResult = { success: true } | { success: false; error: string };

export async function approveDraft(draftId: string): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const professional = await getCurrentProfessional();
  if (!professional) return { success: false, error: 'Profissional não encontrado.' };
  const studio = await getCurrentStudio();
  if (!studio) return { success: false, error: 'Studio não encontrado.' };

  const supabase = await createClient();
  const { data: draft, error } = await supabase
    .from('booking_drafts')
    .select('*')
    .eq('id', draftId)
    .maybeSingle();
  if (error || !draft) return { success: false, error: 'Rascunho não encontrado.' };
  if (draft.status !== 'pending') {
    return { success: false, error: 'Esta solicitação já foi processada.' };
  }

  // Procedure + service
  const { data: service } = await supabase
    .from('professional_services')
    .select('duration_minutes, custom_price')
    .eq('professional_id', professional.id)
    .eq('procedure_id', draft.procedure_id)
    .maybeSingle();
  const { data: procRow } = await supabase
    .from('procedures')
    .select('default_price')
    .eq('id', draft.procedure_id)
    .maybeSingle();
  const duration = service?.duration_minutes ?? 60;
  const price = service?.custom_price ?? procRow?.default_price ?? 0;

  // Procura ou cria cliente pelo phone
  const formattedPhone = formatPhoneBR(draft.client_phone);
  let { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('phone', formattedPhone)
    .maybeSingle();

  if (!existingClient) {
    const { data: created, error: clientError } = await supabase
      .from('clients')
      .insert({
        tenant_id: profile.tenantId,
        full_name: draft.client_full_name,
        phone: formattedPhone,
        email: draft.client_email,
        birth_date: draft.client_birth_date,
        notes: draft.client_notes ?? null,
        tags: [],
      })
      .select('id')
      .single();
    if (clientError || !created) {
      return { success: false, error: clientError?.message ?? 'Erro ao criar cliente.' };
    }
    existingClient = created;
  }

  const startAt = new Date(draft.scheduled_start_at);
  const endAt = new Date(startAt.getTime() + duration * 60_000);

  const { error: insertError } = await supabase.from('appointments').insert({
    tenant_id: profile.tenantId,
    client_id: existingClient.id,
    professional_id: professional.id,
    procedure_id: draft.procedure_id,
    performed_at: startAt.toISOString(),
    scheduled_start_at: startAt.toISOString(),
    scheduled_end_at: endAt.toISOString(),
    price: Number(price),
    status: 'confirmed',
    source: 'public_booking',
    notes_internal: draft.client_notes,
  });
  if (insertError) return { success: false, error: insertError.message };

  await supabase.from('booking_drafts').update({ status: 'confirmed' }).eq('id', draftId);

  revalidatePath('/dashboard/agendamentos-pendentes');
  revalidatePath('/dashboard/agenda');
  revalidatePath('/dashboard');
  void studio;
  return { success: true };
}

export async function rejectDraft(draftId: string, _reason?: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('booking_drafts')
    .update({ status: 'rejected' })
    .eq('id', draftId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/agendamentos-pendentes');
  void _reason;
  return { success: true };
}

export async function deleteDraft(draftId: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('booking_drafts').delete().eq('id', draftId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/agendamentos-pendentes');
  return { success: true };
}
