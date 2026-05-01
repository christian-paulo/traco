import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type {
  AchievementType,
  GoalPeriod,
  GoalStatus,
  GoalType,
} from '@/lib/validations/goal';

export type GoalRow = {
  id: string;
  tenant_id: string;
  type: GoalType;
  target_value: number;
  current_value: number;
  period_type: GoalPeriod;
  start_date: string;
  end_date: string;
  status: GoalStatus;
  title: string;
  description: string | null;
  achieved_at: string | null;
  milestones_reached: number;
  ai_strategy_text: string | null;
  ai_strategy_generated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AchievementRow = {
  id: string;
  tenant_id: string;
  type: AchievementType;
  goal_id: string | null;
  earned_at: string;
  context_data: Record<string, unknown> | null;
  shared: boolean;
};

function castGoal(raw: Record<string, unknown>): GoalRow {
  return {
    ...(raw as unknown as GoalRow),
    target_value: Number((raw as { target_value?: unknown }).target_value ?? 0),
    current_value: Number((raw as { current_value?: unknown }).current_value ?? 0),
  };
}

export async function listActiveGoals(): Promise<GoalRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('status', 'active')
    .order('end_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => castGoal(r as Record<string, unknown>));
}

export async function listAllGoals(): Promise<GoalRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => castGoal(r as Record<string, unknown>));
}

export async function getGoalById(id: string): Promise<GoalRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('goals').select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  return castGoal(data as Record<string, unknown>);
}

export async function listAchievements(
  options: { onlyShared?: boolean } = {},
): Promise<AchievementRow[]> {
  const supabase = await createClient();
  let q = supabase.from('achievements').select('*').order('earned_at', { ascending: false });
  if (options.onlyShared) q = q.eq('shared', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as AchievementRow[];
}
