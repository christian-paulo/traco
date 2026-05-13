'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import { goalSchema, type GoalInput } from '@/lib/validations/goal';

import {
  evaluateAbsoluteAchievements,
  evaluateGoalMilestones,
} from './achievements';

type SimpleResult = { success: true } | { success: false; error: string };
type CreateResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

function flattenZodErrors(error: import('zod').ZodError): string {
  return error.issues.map((i) => i.message).join(' ');
}

export async function createGoal(input: GoalInput): Promise<CreateResult> {
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: flattenZodErrors(parsed.error) };
  }
  if (parsed.data.end_date < parsed.data.start_date) {
    return { success: false, error: 'Data final precisa ser depois da inicial.' };
  }

  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('goals')
    .insert({
      tenant_id: profile.tenantId,
      type: parsed.data.type,
      target_value: parsed.data.target_value,
      period_type: parsed.data.period_type,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      status: 'active',
      created_by: profile.id,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Erro ao criar meta.' };
  }

  // Calcula valor atual com base no histórico do período
  await supabase.rpc('update_goal_progress', { p_goal_id: data.id });

  // Avalia milestones já atingidos (caso a meta seja retroativa)
  await evaluateGoalMilestones(profile.tenantId);
  await evaluateAbsoluteAchievements(profile.tenantId);

  revalidatePath('/dashboard/metas');
  return { success: true, data: { id: data.id } };
}

export async function updateGoal(
  id: string,
  input: GoalInput,
): Promise<SimpleResult> {
  const parsed = goalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: flattenZodErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('goals')
    .update({
      type: parsed.data.type,
      target_value: parsed.data.target_value,
      period_type: parsed.data.period_type,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
    })
    .eq('id', id);
  if (error) return { success: false, error: error.message };

  await supabase.rpc('update_goal_progress', { p_goal_id: id });
  revalidatePath('/dashboard/metas');
  return { success: true };
}

export async function deleteGoal(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/metas');
  return { success: true };
}

export async function cancelGoal(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('goals')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/metas');
  return { success: true };
}

export async function refreshGoalProgress(id: string): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();
  await supabase.rpc('update_goal_progress', { p_goal_id: id });
  await evaluateGoalMilestones(profile.tenantId);
  revalidatePath('/dashboard/metas');
  return { success: true };
}

export async function refreshAllGoalsProgress(): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const supabase = await createClient();
  await supabase.rpc('refresh_active_goals', { p_tenant_id: profile.tenantId });
  await evaluateGoalMilestones(profile.tenantId);
  await evaluateAbsoluteAchievements(profile.tenantId);
  return { success: true };
}

export async function markAchievementShared(
  id: string,
): Promise<SimpleResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('achievements')
    .update({ shared: true })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/metas');
  return { success: true };
}

export async function markAchievementsSeen(): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('achievements')
    .update({ seen_at: new Date().toISOString() })
    .is('seen_at', null);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/metas');
  return { success: true };
}
