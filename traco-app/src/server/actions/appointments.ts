'use server';

import { revalidatePath } from 'next/cache';

import { sendPostAttendanceEmail } from '@/lib/email';
import type { AchievementType } from '@/lib/validations/goal';
import {
  detectActivityAchievements,
  evaluateAbsoluteAchievements,
  evaluateGoalMilestones,
} from '@/server/actions/achievements';
import { formatCurrency, formatDate } from '@/lib/format';
import { getCurrentProfessional } from '@/lib/queries/studio';
import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import {
  appointmentSchema,
  scheduledAppointmentSchema,
  type AppointmentInput,
  type ScheduledAppointmentInput,
} from '@/lib/validations/appointment';

type SimpleResult = { success: true } | { success: false; error: string };
type CreateResult = { success: true; data: { id: string } } | { success: false; error: string };
type FinalizeResult =
  | { success: true; data: { newAchievements: AchievementType[] } }
  | { success: false; error: string };

function flattenZodErrors(error: import('zod').ZodError): string {
  return error.issues.map((i) => i.message).join(' ');
}

export async function createAppointment(input: AppointmentInput): Promise<CreateResult> {
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: flattenZodErrors(parsed.error) };
  }

  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      tenant_id: profile.tenantId,
      client_id: parsed.data.client_id,
      procedure_id: parsed.data.procedure_id,
      performed_at: new Date(parsed.data.performed_at).toISOString(),
      price: parsed.data.price,
      notes: parsed.data.notes,
      status: 'completed',
      source: 'manual',
    })
    .select('id, client_id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Erro ao registrar atendimento.' };
  }

  revalidatePath('/dashboard/atendimentos');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/agenda');
  revalidatePath(`/dashboard/clientes/${data.client_id}`);
  return { success: true, data: { id: data.id } };
}

export async function createScheduledAppointment(
  input: ScheduledAppointmentInput,
): Promise<CreateResult> {
  const parsed = scheduledAppointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: flattenZodErrors(parsed.error) };
  }

  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const professional = await getCurrentProfessional();
  if (!professional) return { success: false, error: 'Profissional não configurado.' };

  const supabase = await createClient();
  const startAt = new Date(parsed.data.scheduled_start_at);
  const endAt = new Date(parsed.data.scheduled_end_at);

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      tenant_id: profile.tenantId,
      professional_id: professional.id,
      client_id: parsed.data.client_id,
      procedure_id: parsed.data.procedure_id,
      performed_at: startAt.toISOString(),
      scheduled_start_at: startAt.toISOString(),
      scheduled_end_at: endAt.toISOString(),
      price: parsed.data.price,
      notes: parsed.data.notes,
      notes_internal: parsed.data.notes_internal ?? null,
      status: 'confirmed',
      source: 'manual',
    })
    .select('id, client_id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Erro ao agendar.' };
  }

  revalidatePath('/dashboard/atendimentos');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/agenda');
  revalidatePath(`/dashboard/clientes/${data.client_id}`);
  return { success: true, data: { id: data.id } };
}

export async function updateAppointment(
  id: string,
  input: AppointmentInput,
): Promise<SimpleResult> {
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: flattenZodErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('appointments')
    .update({
      client_id: parsed.data.client_id,
      procedure_id: parsed.data.procedure_id,
      performed_at: new Date(parsed.data.performed_at).toISOString(),
      price: parsed.data.price,
      notes: parsed.data.notes,
    })
    .eq('id', id)
    .select('client_id')
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/atendimentos');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/agenda');
  if (data?.client_id) revalidatePath(`/dashboard/clientes/${data.client_id}`);
  return { success: true };
}

export async function updateAppointmentStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show',
): Promise<SimpleResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select('client_id')
    .single();
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/atendimentos');
  revalidatePath('/dashboard/agenda');
  if (data?.client_id) revalidatePath(`/dashboard/clientes/${data.client_id}`);
  return { success: true };
}

export async function deleteAppointment(id: string): Promise<SimpleResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('appointments')
    .select('client_id')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/atendimentos');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/agenda');
  if (existing?.client_id) revalidatePath(`/dashboard/clientes/${existing.client_id}`);
  return { success: true };
}

export async function getAppointment(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('appointments')
    .select(
      'id, client_id, procedure_id, performed_at, scheduled_start_at, scheduled_end_at, status, price, notes, notes_internal, return_due_date, clients(id, full_name, phone), procedures(id, name, color)',
    )
    .eq('id', id)
    .maybeSingle();
  return data;
}

type FinalizeInput = {
  status: 'completed' | 'cancelled' | 'no_show';
  final_price?: number;
  return_due_date?: string | null;
  final_note?: string;
};

const DEFAULT_POST_CARE = [
  'Evite molhar a região por 24h.',
  'Não use cremes oleosos por 48h.',
  'Mantenha distância de calor intenso (sauna, secador) nos primeiros 2 dias.',
];

export async function finalizeAppointment(
  appointmentId: string,
  input: FinalizeInput,
): Promise<FinalizeResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const supabase = await createClient();

  const update: {
    status: 'completed' | 'cancelled' | 'no_show';
    price?: number;
    return_due_date?: string | null;
  } = { status: input.status };
  if (typeof input.final_price === 'number' && Number.isFinite(input.final_price)) {
    update.price = input.final_price;
  }
  if (input.return_due_date !== undefined) {
    update.return_due_date = input.return_due_date;
  }

  const { data: row, error } = await supabase
    .from('appointments')
    .update(update)
    .eq('id', appointmentId)
    .select(
      'client_id, performed_at, price, return_due_date, procedures(name), clients(full_name, email)',
    )
    .single();

  if (error) return { success: false, error: error.message };

  if (input.final_note && input.final_note.trim().length > 0 && row?.client_id) {
    await supabase.from('professional_notes').insert({
      tenant_id: profile.tenantId,
      client_id: row.client_id,
      appointment_id: appointmentId,
      title: 'Observação ao finalizar atendimento',
      content: input.final_note.trim(),
      created_by: profile.id,
    });
  }

  // Email pós-atendimento (apenas para 'completed' com email da cliente)
  if (input.status === 'completed' && row) {
    type RawProc = { name?: string };
    type RawClient = { full_name?: string; email?: string | null };
    const procRaw = row.procedures as RawProc | RawProc[] | null;
    const proc = Array.isArray(procRaw) ? procRaw[0] : procRaw;
    const clientRaw = row.clients as RawClient | RawClient[] | null;
    const clientObj = Array.isArray(clientRaw) ? clientRaw[0] : clientRaw;
    if (clientObj?.email) {
      const finalPrice =
        typeof input.final_price === 'number' && Number.isFinite(input.final_price)
          ? input.final_price
          : Number(row.price ?? 0);
      const returnIso = input.return_due_date ?? row.return_due_date ?? null;
      void sendPostAttendanceEmail({
        to: clientObj.email,
        clientName: clientObj.full_name ?? 'Cliente',
        designerName: profile.fullName ?? 'Sua designer',
        procedureName: proc?.name ?? 'Procedimento',
        performedDate: formatDate(row.performed_at, 'long'),
        finalPrice: formatCurrency(finalPrice),
        returnDate: returnIso ? formatDate(returnIso, 'long') : null,
        postCareNotes: DEFAULT_POST_CARE,
      }).catch((err) => {
        console.error('[finalize] Falha ao enviar email pós-atendimento:', err);
      });
    }
  }

  // Goals + achievements (await pra retornar tipos novos pro client toastar)
  let newAchievements: AchievementType[] = [];
  if (input.status === 'completed') {
    try {
      const [milestones, absolutes, activity] = await Promise.all([
        evaluateGoalMilestones(profile.tenantId),
        evaluateAbsoluteAchievements(profile.tenantId),
        detectActivityAchievements(profile.tenantId),
      ]);
      newAchievements = [...milestones, ...absolutes, ...activity];
    } catch (err) {
      console.error('[finalize] achievements:', err);
    }
  }

  revalidatePath('/dashboard/agenda');
  revalidatePath('/dashboard/atendimentos');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/metas');
  if (row?.client_id) revalidatePath(`/dashboard/clientes/${row.client_id}`);
  return { success: true, data: { newAchievements } };
}
