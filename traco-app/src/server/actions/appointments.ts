'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import { appointmentSchema, type AppointmentInput } from '@/lib/validations/appointment';

type SimpleResult = { success: true } | { success: false; error: string };
type CreateResult = { success: true; data: { id: string } } | { success: false; error: string };

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
    })
    .select('id, client_id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Erro ao registrar atendimento.' };
  }

  revalidatePath('/dashboard/atendimentos');
  revalidatePath('/dashboard');
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
  if (existing?.client_id) revalidatePath(`/dashboard/clientes/${existing.client_id}`);
  return { success: true };
}

export async function getAppointment(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('appointments')
    .select(
      'id, client_id, procedure_id, performed_at, price, notes, return_due_date, clients(id, full_name, phone), procedures(id, name, color)',
    )
    .eq('id', id)
    .maybeSingle();
  return data;
}
