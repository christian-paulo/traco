'use server';

import { revalidatePath } from 'next/cache';

import {
  sendBookingConfirmedClientEmail,
  sendBookingRejectedClientEmail,
} from '@/lib/email';
import { formatDateTimeShort } from '@/lib/format';
import { getAvailableSlots } from '@/lib/queries/availability';
import { getCurrentProfessional, getCurrentStudio } from '@/lib/queries/studio';
import { getCurrentProfile } from '@/lib/queries/profile';
import { formatPhoneBR } from '@/lib/utils/phone';
import { createClient } from '@/lib/supabase/server';

type SimpleResult = { success: true } | { success: false; error: string };
type ApproveResult =
  | { success: true }
  | { success: false; error: string; conflict?: boolean };

function dateOnly(iso: string): string {
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}
function isoToMin(iso: string): number {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return -1;
  return Number(m[1]) * 60 + Number(m[2]);
}

export async function approveDraft(draftId: string): Promise<ApproveResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const professional = await getCurrentProfessional();
  if (!professional) return { success: false, error: 'Profissional não encontrado.' };
  const studio = await getCurrentStudio();
  if (!studio) return { success: false, error: 'Studio não encontrado.' };

  const supabase = await createClient();
  const { data: draft, error } = await supabase
    .from('booking_drafts')
    .select('*, procedures(name)')
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

  // Re-checa que slot ainda está livre
  const slotDate = dateOnly(draft.scheduled_start_at);
  const requestedMin = isoToMin(draft.scheduled_start_at);
  if (slotDate && requestedMin >= 0) {
    const slots = await getAvailableSlots({
      professionalId: professional.id,
      procedureId: draft.procedure_id,
      date: slotDate,
    });
    const stillFree = slots.some((s) => isoToMin(s.start) === requestedMin);
    if (!stillFree) {
      return {
        success: false,
        conflict: true,
        error:
          'Esse horário foi ocupado entre a solicitação e agora. Sugira outro horário pra cliente.',
      };
    }
  }

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

  // Email pra cliente
  if (draft.client_email) {
    type ProcRel = { name?: string };
    const procRel = draft.procedures as ProcRel | ProcRel[] | null;
    const procObj = Array.isArray(procRel) ? procRel[0] : procRel;
    void sendBookingConfirmedClientEmail({
      to: draft.client_email,
      clientName: draft.client_full_name,
      designerName: profile.fullName ?? 'sua designer',
      studioName: studio.name,
      studioAddress: studio.address,
      scheduledFormatted: formatDateTimeShort(draft.scheduled_start_at),
      procedureName: procObj?.name ?? 'Procedimento',
    }).catch((err) =>
      console.error('[approveDraft] erro ao enviar email confirmação:', err),
    );
  }

  revalidatePath('/dashboard/agendamentos-pendentes');
  revalidatePath('/dashboard/agenda');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function rejectDraft(
  draftId: string,
  reason?: string,
): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  const studio = await getCurrentStudio();

  const supabase = await createClient();
  const { data: draft } = await supabase
    .from('booking_drafts')
    .select('*, procedures(name)')
    .eq('id', draftId)
    .maybeSingle();

  const { error } = await supabase
    .from('booking_drafts')
    .update({ status: 'rejected' })
    .eq('id', draftId);
  if (error) return { success: false, error: error.message };

  if (draft?.client_email && studio && profile) {
    type ProcRel = { name?: string };
    const procRel = draft.procedures as ProcRel | ProcRel[] | null;
    const procObj = Array.isArray(procRel) ? procRel[0] : procRel;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://traco.app';
    void sendBookingRejectedClientEmail({
      to: draft.client_email,
      clientName: draft.client_full_name,
      designerName: profile.fullName ?? 'sua designer',
      studioName: studio.name,
      scheduledFormatted: formatDateTimeShort(draft.scheduled_start_at),
      procedureName: procObj?.name ?? 'Procedimento',
      reason: reason?.trim() || null,
      bookingUrl: `${baseUrl}/agendar/${studio.slug}`,
    }).catch((err) => console.error('[rejectDraft] erro ao enviar email recusa:', err));
  }

  revalidatePath('/dashboard/agendamentos-pendentes');
  return { success: true };
}

export async function deleteDraft(draftId: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('booking_drafts').delete().eq('id', draftId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/agendamentos-pendentes');
  return { success: true };
}
