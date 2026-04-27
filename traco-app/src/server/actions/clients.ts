'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import { formatPhoneBR } from '@/lib/utils/phone';
import { clientFormSchema, type ClientFormInput } from '@/lib/validations/client';

type SimpleResult = { success: true } | { success: false; error: string };
type CreateResult = { success: true; data: { id: string } } | { success: false; error: string };

function flattenZodErrors(error: import('zod').ZodError): string {
  return error.issues.map((i) => i.message).join(' ');
}

export async function createClientRecord(input: ClientFormInput): Promise<CreateResult> {
  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: flattenZodErrors(parsed.error) };
  }

  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clients')
    .insert({
      tenant_id: profile.tenantId,
      full_name: parsed.data.full_name,
      phone: formatPhoneBR(parsed.data.phone),
      email: parsed.data.email,
      birth_date: parsed.data.birth_date,
      skin_phototype: parsed.data.skin_phototype ?? null,
      notes: parsed.data.notes,
      tags: parsed.data.tags,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Erro ao cadastrar cliente.' };
  }

  revalidatePath('/dashboard/clientes');
  revalidatePath('/dashboard');
  return { success: true, data: { id: data.id } };
}

export async function updateClientRecord(
  id: string,
  input: ClientFormInput,
): Promise<SimpleResult> {
  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: flattenZodErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('clients')
    .update({
      full_name: parsed.data.full_name,
      phone: formatPhoneBR(parsed.data.phone),
      email: parsed.data.email,
      birth_date: parsed.data.birth_date,
      skin_phototype: parsed.data.skin_phototype ?? null,
      notes: parsed.data.notes,
      tags: parsed.data.tags,
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/clientes');
  revalidatePath(`/dashboard/clientes/${id}`);
  return { success: true };
}

export async function deleteClientRecord(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/clientes');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getClientRecord(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
  return data;
}
