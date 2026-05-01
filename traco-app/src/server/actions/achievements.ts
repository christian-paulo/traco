import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import type { AchievementType } from '@/lib/validations/goal';

/**
 * Garante que uma achievement existe (insert idempotente via UNIQUE constraint).
 * Usa admin client porque é chamado de fluxos de servidor — não depende do user atual.
 */
export async function ensureAchievement(args: {
  tenantId: string;
  type: AchievementType;
  goalId?: string | null;
  contextData?: Record<string, unknown>;
}): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('achievements')
    .upsert(
      {
        tenant_id: args.tenantId,
        type: args.type,
        goal_id: args.goalId ?? null,
        context_data: (args.contextData ?? null) as never,
      },
      { onConflict: 'tenant_id,type,goal_id', ignoreDuplicates: true },
    )
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('[achievements] erro:', error.message);
    return false;
  }
  return Boolean(data);
}

const GOAL_MILESTONE_MAP: Array<{ pct: number; type: AchievementType }> = [
  { pct: 25, type: 'goal_25' },
  { pct: 50, type: 'goal_50' },
  { pct: 75, type: 'goal_75' },
  { pct: 100, type: 'goal_100' },
];

/**
 * Avalia metas ativas do tenant e cria achievements quando atingem milestone.
 * Atualiza milestones_reached pra evitar duplicação.
 */
export async function evaluateGoalMilestones(tenantId: string): Promise<void> {
  const supabase = createAdminClient();
  const { data: goals } = await supabase
    .from('goals')
    .select('id, target_value, current_value, milestones_reached, status, title')
    .eq('tenant_id', tenantId)
    .in('status', ['active', 'achieved']);
  if (!goals || goals.length === 0) return;

  for (const g of goals) {
    const target = Number(g.target_value ?? 0);
    const current = Number(g.current_value ?? 0);
    if (target <= 0) continue;
    const pct = Math.floor((current / target) * 100);
    let highest = Number(g.milestones_reached ?? 0);

    for (const ms of GOAL_MILESTONE_MAP) {
      if (pct >= ms.pct && highest < ms.pct) {
        await ensureAchievement({
          tenantId,
          type: ms.type,
          goalId: g.id as string,
          contextData: {
            title: g.title,
            target,
            current,
            milestone: ms.pct,
          },
        });
        highest = ms.pct;
      }
    }

    if (highest > Number(g.milestones_reached ?? 0)) {
      await supabase
        .from('goals')
        .update({ milestones_reached: highest })
        .eq('id', g.id as string);
    }
  }
}

/**
 * Avalia conquistas absolutas do tenant (1ª/10ª/100ª cliente, primeira recuperação, etc).
 * Idempotente.
 */
export async function evaluateAbsoluteAchievements(tenantId: string): Promise<void> {
  const supabase = createAdminClient();

  const [{ count: clientCount }, { count: recoveryCount }] = await Promise.all([
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .not('last_recovery_email_sent_at', 'is', null),
  ]);

  const cc = clientCount ?? 0;
  if (cc >= 1) await ensureAchievement({ tenantId, type: 'first_client' });
  if (cc >= 10) await ensureAchievement({ tenantId, type: 'tenth_client' });
  if (cc >= 100) await ensureAchievement({ tenantId, type: 'hundredth_client' });
  if ((recoveryCount ?? 0) >= 1) {
    await ensureAchievement({ tenantId, type: 'first_recovery' });
  }
}
