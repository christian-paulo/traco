import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import type { AchievementType } from '@/lib/validations/goal';

/**
 * Garante que uma achievement existe (insert idempotente).
 * Retorna o tipo da achievement se foi criada AGORA (pra disparar toast).
 * Retorna null se já existia.
 *
 * IMPORTANTE: pre-check explícito porque Postgres trata NULL != NULL em UNIQUE,
 * e achievements absolutas (first_client, etc) usam goal_id = NULL. O constraint
 * UNIQUE(tenant_id, type, goal_id) sozinho não bloqueava duplicatas no caso NULL.
 * Migration 11 adicionou partial unique index pro NULL case como cinto + suspensório.
 */
export async function ensureAchievement(args: {
  tenantId: string;
  type: AchievementType;
  goalId?: string | null;
  contextData?: Record<string, unknown>;
}): Promise<AchievementType | null> {
  const supabase = createAdminClient();
  const goalId = args.goalId ?? null;

  // Pre-check: existe?
  const existsQuery = supabase
    .from('achievements')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', args.tenantId)
    .eq('type', args.type);
  const filtered =
    goalId === null ? existsQuery.is('goal_id', null) : existsQuery.eq('goal_id', goalId);
  const { count } = await filtered;
  if ((count ?? 0) > 0) return null;

  // Insert. Se houver race, o partial index ou o UNIQUE constraint vão barrar
  // com erro 23505 (unique_violation) — tratamos como "já existia".
  const { error } = await supabase.from('achievements').insert({
    tenant_id: args.tenantId,
    type: args.type,
    goal_id: goalId,
    context_data: (args.contextData ?? null) as never,
  });

  if (error) {
    if (error.code === '23505') return null; // race condition: outra request já criou
    console.error('[achievements] erro:', error.message);
    return null;
  }
  return args.type;
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
 * Retorna array de tipos novos criados.
 */
export async function evaluateGoalMilestones(
  tenantId: string,
): Promise<AchievementType[]> {
  const supabase = createAdminClient();
  const created: AchievementType[] = [];
  const { data: goals } = await supabase
    .from('goals')
    .select('id, target_value, current_value, milestones_reached, status, title')
    .eq('tenant_id', tenantId)
    .in('status', ['active', 'achieved']);
  if (!goals || goals.length === 0) return created;

  for (const g of goals) {
    const target = Number(g.target_value ?? 0);
    const current = Number(g.current_value ?? 0);
    if (target <= 0) continue;
    const pct = Math.floor((current / target) * 100);
    let highest = Number(g.milestones_reached ?? 0);

    for (const ms of GOAL_MILESTONE_MAP) {
      if (pct >= ms.pct && highest < ms.pct) {
        const newType = await ensureAchievement({
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
        if (newType) created.push(newType);
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
  return created;
}

/**
 * Avalia conquistas absolutas do tenant (1ª/10ª/100ª cliente, primeira recuperação, etc).
 * Idempotente.
 */
export async function evaluateAbsoluteAchievements(
  tenantId: string,
): Promise<AchievementType[]> {
  const supabase = createAdminClient();
  const created: AchievementType[] = [];

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
  const checks: Array<{ condition: boolean; type: AchievementType }> = [
    { condition: cc >= 1, type: 'first_client' },
    { condition: cc >= 10, type: 'tenth_client' },
    { condition: cc >= 100, type: 'hundredth_client' },
    { condition: (recoveryCount ?? 0) >= 1, type: 'first_recovery' },
  ];
  for (const c of checks) {
    if (c.condition) {
      const t = await ensureAchievement({ tenantId, type: c.type });
      if (t) created.push(t);
    }
  }
  return created;
}

// ============================================================================
// DETECTORES NOVOS — Streaks, Monthly Record, Big Recovery, First Month Pro
// ============================================================================

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Detecta streak_7 e streak_30: dias consecutivos com appointments completed
 * terminando hoje. streak_30 só dispara se streak_7 já existe historicamente.
 */
export async function detectStreaks(tenantId: string): Promise<AchievementType[]> {
  const supabase = createAdminClient();
  const created: AchievementType[] = [];

  // Janela de 30 dias: olha appointments completed nos últimos 30 dias
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windowStart = new Date(today);
  windowStart.setDate(today.getDate() - 29);

  const { data: appts } = await supabase
    .from('appointments')
    .select('performed_at, status')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('performed_at', windowStart.toISOString())
    .lte('performed_at', new Date(today.getTime() + 86_400_000 - 1).toISOString());

  if (!appts || appts.length === 0) return created;

  const daysWithAppt = new Set<string>();
  for (const a of appts) {
    const d = new Date((a as { performed_at: string }).performed_at);
    daysWithAppt.add(isoDate(d));
  }

  // Streak terminando em hoje
  let streakDays = 0;
  for (let i = 0; i < 30; i += 1) {
    const cursor = new Date(today);
    cursor.setDate(today.getDate() - i);
    if (daysWithAppt.has(isoDate(cursor))) {
      streakDays += 1;
    } else {
      break;
    }
  }

  if (streakDays >= 7) {
    const t = await ensureAchievement({
      tenantId,
      type: 'streak_7',
      contextData: { days: streakDays, ending: isoDate(today) },
    });
    if (t) created.push(t);
  }

  if (streakDays >= 30) {
    // streak_30 só vale se já tem streak_7 (idempotência via UNIQUE garante isso de qualquer forma)
    const t = await ensureAchievement({
      tenantId,
      type: 'streak_30',
      contextData: { days: streakDays, ending: isoDate(today) },
    });
    if (t) created.push(t);
  }

  return created;
}

/**
 * Detecta monthly_record: receita do mês corrente > mês anterior.
 * Conquista por mês — UNIQUE constraint impede duplicação no mesmo mês.
 */
export async function detectMonthlyRecord(
  tenantId: string,
): Promise<AchievementType[]> {
  const supabase = createAdminClient();
  const created: AchievementType[] = [];

  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  const [{ data: cur }, { data: prev }] = await Promise.all([
    supabase
      .from('appointments')
      .select('price')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .gte('performed_at', currentMonthStart.toISOString())
      .lte('performed_at', currentMonthEnd.toISOString()),
    supabase
      .from('appointments')
      .select('price')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .gte('performed_at', previousMonthStart.toISOString())
      .lte('performed_at', previousMonthEnd.toISOString()),
  ]);

  const currentRevenue = (cur ?? []).reduce(
    (s, r) => s + Number((r as { price?: number }).price ?? 0),
    0,
  );
  const previousRevenue = (prev ?? []).reduce(
    (s, r) => s + Number((r as { price?: number }).price ?? 0),
    0,
  );

  // Precisa ter um mês anterior com receita pra comparar (senão sempre seria recorde)
  if (previousRevenue <= 0) return created;
  if (currentRevenue <= previousRevenue) return created;

  const monthKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;
  const improvementPct = ((currentRevenue - previousRevenue) / previousRevenue) * 100;

  // Idempotência por mês: usa goal_id como chave artificial pra UNIQUE.
  // Como nossa UNIQUE é (tenant_id, type, goal_id), e goal_id é nullable,
  // checamos manualmente se já existe achievement do mesmo mês.
  const { data: existing } = await supabase
    .from('achievements')
    .select('id, context_data')
    .eq('tenant_id', tenantId)
    .eq('type', 'monthly_record');
  const alreadyForThisMonth = (existing ?? []).some((a) => {
    const ctx = (a as { context_data?: { month?: string } | null }).context_data;
    return ctx?.month === monthKey;
  });
  if (alreadyForThisMonth) return created;

  // Insere com goal_id null (UNIQUE permite múltiplos achievements deste tipo se cada
  // month_key for diferente — verificação manual acima cobre isso).
  const { error } = await supabase.from('achievements').insert({
    tenant_id: tenantId,
    type: 'monthly_record',
    goal_id: null,
    context_data: {
      month: monthKey,
      current_month_revenue: currentRevenue,
      previous_month_revenue: previousRevenue,
      improvement_percentage: Number(improvementPct.toFixed(1)),
    } as never,
  });
  if (!error) created.push('monthly_record');
  return created;
}

/**
 * Detecta big_recovery: 5+ atendimentos completed no mês corrente
 * de clientes que receberam recovery email (last_recovery_email_sent_at != null
 * antes do appointment) OU appointments com source = 'recovery'.
 */
export async function detectBigRecovery(
  tenantId: string,
): Promise<AchievementType[]> {
  const supabase = createAdminClient();
  const created: AchievementType[] = [];

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
  const monthKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`;

  // Conta clients (DISTINCT) que tiveram appointment completed no mês corrente
  // com last_recovery_email_sent_at definido antes do appointment OU source='recovery'
  const { data: appts } = await supabase
    .from('appointments')
    .select('client_id, performed_at, source, clients(last_recovery_email_sent_at)')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('performed_at', monthStart.toISOString())
    .lte('performed_at', monthEnd.toISOString());

  type RawClient = { last_recovery_email_sent_at?: string | null };
  type Raw = {
    client_id: string;
    performed_at: string;
    source: string | null;
    clients: RawClient | RawClient[] | null;
  };
  const recoveredClients = new Set<string>();
  for (const raw of appts ?? []) {
    const r = raw as unknown as Raw;
    const isRecoverySource = r.source === 'recovery';
    const c = Array.isArray(r.clients) ? r.clients[0] : r.clients;
    const recoverySent = c?.last_recovery_email_sent_at;
    const recoveredViaEmail =
      recoverySent && new Date(recoverySent).getTime() <= new Date(r.performed_at).getTime();
    if (isRecoverySource || recoveredViaEmail) {
      recoveredClients.add(r.client_id);
    }
  }

  if (recoveredClients.size < 5) return created;

  // Idempotência por mês
  const { data: existing } = await supabase
    .from('achievements')
    .select('id, context_data')
    .eq('tenant_id', tenantId)
    .eq('type', 'big_recovery');
  const alreadyForThisMonth = (existing ?? []).some((a) => {
    const ctx = (a as { context_data?: { month?: string } | null }).context_data;
    return ctx?.month === monthKey;
  });
  if (alreadyForThisMonth) return created;

  const { error } = await supabase.from('achievements').insert({
    tenant_id: tenantId,
    type: 'big_recovery',
    goal_id: null,
    context_data: {
      month: monthKey,
      recovered_clients_count: recoveredClients.size,
    } as never,
  });
  if (!error) created.push('big_recovery');
  return created;
}

/**
 * TODO: ativar quando o sistema de billing estiver no ar.
 * Hoje, sem coluna `plan` em tenants/profiles e sem subscriptions, não há como
 * determinar se um tenant está com plano Pro há 30 dias. Stub no-op.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function detectFirstMonthPro(
  _tenantId: string,
): Promise<AchievementType[]> {
  // TODO: implementar quando billing entrar
  return [];
}

/**
 * Roda todos os detectores leves que dependem de evento (após finalize).
 * Retorna achievements criadas agora (pra toast).
 */
export async function detectActivityAchievements(
  tenantId: string,
): Promise<AchievementType[]> {
  const all: AchievementType[] = [];
  const [streaks, recovery] = await Promise.all([
    detectStreaks(tenantId),
    detectBigRecovery(tenantId),
  ]);
  all.push(...streaks, ...recovery);
  return all;
}
