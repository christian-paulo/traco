'use server';

import { revalidatePath } from 'next/cache';

import { sendRecoveryEmail as sendRecoveryEmailRaw } from '@/lib/email';
import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import { digitsOnly, formatPhoneBR } from '@/lib/utils/phone';
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

const DEFAULT_WHATSAPP_TEMPLATE =
  'Olá! Vi que faz {dias} dias do meu último {procedimento}. Gostaria de agendar meu retorno.';

function buildWhatsappUrl(designerPhone: string, message: string): string | null {
  const digits = digitsOnly(designerPhone);
  if (!digits) return null;
  const e164 = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}

export async function sendRecoveryEmail(clientId: string): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('id, full_name, email, phone')
    .eq('id', clientId)
    .maybeSingle();
  if (!client) return { success: false, error: 'Cliente não encontrada.' };
  if (!client.email) {
    return { success: false, error: 'Cliente sem email cadastrado.' };
  }

  const { data: lastAppt } = await supabase
    .from('appointments')
    .select('performed_at, return_due_date, procedures(name, default_price)')
    .eq('client_id', clientId)
    .order('performed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const procRaw = (lastAppt as unknown as { procedures?: unknown })?.procedures ?? null;
  const proc = Array.isArray(procRaw)
    ? (procRaw[0] as { name?: string } | undefined)
    : (procRaw as { name?: string } | null);
  const procedureName = proc?.name ?? 'procedimento';

  const dueDate = lastAppt?.return_due_date
    ? new Date(`${lastAppt.return_due_date}T00:00:00Z`)
    : null;
  const today = new Date();
  const daysOverdue = dueDate
    ? Math.max(1, Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000))
    : 1;

  const { data: tenantRow } = await supabase
    .from('tenants')
    .select('whatsapp_template')
    .eq('id', profile.tenantId)
    .maybeSingle();

  const { data: designerRow } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', profile.id)
    .maybeSingle();

  const message = (tenantRow?.whatsapp_template ?? DEFAULT_WHATSAPP_TEMPLATE)
    .replace('{dias}', String(daysOverdue))
    .replace('{procedimento}', procedureName);

  const whatsappUrl = buildWhatsappUrl(designerRow?.phone ?? '', message);
  if (!whatsappUrl) {
    return {
      success: false,
      error: 'Configure seu WhatsApp em Configurações > Conta antes de enviar lembretes.',
    };
  }

  const result = await sendRecoveryEmailRaw({
    to: client.email,
    clientName: client.full_name,
    designerName: profile.fullName ?? 'Sua designer',
    lastProcedure: procedureName,
    daysOverdue,
    whatsappUrl,
  });
  if (!result.success) return { success: false, error: result.error };

  await supabase
    .from('clients')
    .update({ last_recovery_email_sent_at: new Date().toISOString() })
    .eq('id', clientId);

  revalidatePath('/dashboard/recuperar');
  revalidatePath(`/dashboard/clientes/${clientId}`);
  return { success: true };
}

export async function sendBulkRecoveryEmails(
  clientIds: string[],
): Promise<{ success: true; sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];
  for (const id of clientIds) {
    const r = await sendRecoveryEmail(id);
    if (r.success) sent += 1;
    else {
      failed += 1;
      errors.push(r.error);
    }
  }
  return { success: true, sent, failed, errors };
}
