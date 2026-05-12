'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import { procedureSchema, type ProcedureInput } from '@/lib/validations/procedure';

type SimpleResult = { success: true } | { success: false; error: string };
type CreateResult = { success: true; data: { id: string } } | { success: false; error: string };

export async function createProcedure(input: ProcedureInput): Promise<CreateResult> {
  const parsed = procedureSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(' ') };
  }

  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('procedures')
    .insert({
      tenant_id: profile.tenantId,
      name: parsed.data.name,
      default_price: parsed.data.default_price,
      default_return_days: parsed.data.default_return_days,
      color: parsed.data.color,
      is_active: parsed.data.is_active ?? true,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Erro ao criar procedimento.' };
  }

  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/onboarding');
  return { success: true, data: { id: data.id } };
}

export async function deleteProcedure(id: string): Promise<SimpleResult> {
  const supabase = await createClient();

  // Verifica se há atendimentos vinculados — não deixa deletar se sim
  const { count } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('procedure_id', id);

  if ((count ?? 0) > 0) {
    return {
      success: false,
      error:
        'Não dá pra excluir — esse procedimento tem atendimentos vinculados. Desative no toggle.',
    };
  }

  const { error } = await supabase.from('procedures').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/onboarding');
  return { success: true };
}

export async function updateProcedure(id: string, input: ProcedureInput): Promise<SimpleResult> {
  const parsed = procedureSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(' ') };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('procedures')
    .update({
      name: parsed.data.name,
      default_price: parsed.data.default_price,
      default_return_days: parsed.data.default_return_days,
      color: parsed.data.color,
      ...(parsed.data.is_active !== undefined ? { is_active: parsed.data.is_active } : {}),
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/dashboard/atendimentos');
  return { success: true };
}

export async function toggleProcedureActive(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { data: current, error: fetchError } = await supabase
    .from('procedures')
    .select('is_active')
    .eq('id', id)
    .maybeSingle();
  if (fetchError || !current) {
    return { success: false, error: fetchError?.message ?? 'Procedimento não encontrado.' };
  }

  const { error } = await supabase
    .from('procedures')
    .update({ is_active: !current.is_active })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/dashboard/atendimentos');
  return { success: true };
}
