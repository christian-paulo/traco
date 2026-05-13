'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';

type SimpleResult = { success: true } | { success: false; error: string };

export type FollowupChannel = 'whatsapp' | 'sms' | 'phone' | 'in_person';
export type FollowupOutcome = 'pending' | 'scheduled' | 'declined' | 'no_response';

/**
 * Registra um contato feito com a cliente. Chamado tipicamente quando designer
 * clica "WhatsApp" no card de retorno — outcome inicia como 'pending'.
 */
export async function logFollowup(input: {
  clientId: string;
  channel: FollowupChannel;
  notes?: string | null;
}): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const supabase = await createClient();

  const { error } = await supabase.from('client_followups').insert({
    tenant_id: profile.tenantId,
    client_id: input.clientId,
    channel: input.channel,
    outcome: 'pending',
    notes: input.notes ?? null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/clientes');
  revalidatePath(`/dashboard/clientes/${input.clientId}`);
  return { success: true };
}

/**
 * Marca o resultado do follow-up mais recente da cliente.
 * - scheduled: cliente agendou → some da lista de retornos por 90 dias
 * - declined: não vai voltar → arquiva 180 dias
 * - no_response: marcação manual de "não respondeu"
 */
export async function resolveFollowup(input: {
  clientId: string;
  outcome: Exclude<FollowupOutcome, 'pending'>;
  notes?: string | null;
}): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const supabase = await createClient();

  // Busca o último follow-up pending desse cliente
  const { data: existing } = await supabase
    .from('client_followups')
    .select('id')
    .eq('client_id', input.clientId)
    .eq('outcome', 'pending')
    .order('contacted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('client_followups')
      .update({
        outcome: input.outcome,
        resolved_at: new Date().toISOString(),
        notes: input.notes ?? null,
      })
      .eq('id', existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    // Sem follow-up prévio — cria um já resolvido (ex: cliente apareceu sem ser contatada)
    const { error } = await supabase.from('client_followups').insert({
      tenant_id: profile.tenantId,
      client_id: input.clientId,
      channel: 'in_person',
      outcome: input.outcome,
      resolved_at: new Date().toISOString(),
      notes: input.notes ?? null,
    });
    if (error) return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/clientes');
  revalidatePath(`/dashboard/clientes/${input.clientId}`);
  return { success: true };
}
