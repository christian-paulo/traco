import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  detectBigRecovery,
  detectMonthlyRecord,
  detectStreaks,
  evaluateAbsoluteAchievements,
  evaluateGoalMilestones,
} from '@/server/actions/achievements';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Vercel Cron — roda diariamente às 6h.
 * Vercel envia GET com header `Authorization: Bearer ${CRON_SECRET}`.
 * Em desenvolvimento local pode ser chamado manualmente com o mesmo header.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'CRON_SECRET não configurado.' },
      { status: 500 },
    );
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const startedAt = Date.now();
  const summary: Array<{
    tenantId: string;
    created: string[];
    error?: string;
  }> = [];
  let totalCreated = 0;

  for (const t of tenants ?? []) {
    const tenantId = t.id as string;
    try {
      const [streaks, monthly, recovery, milestones, absolutes] = await Promise.all([
        detectStreaks(tenantId),
        detectMonthlyRecord(tenantId),
        detectBigRecovery(tenantId),
        evaluateGoalMilestones(tenantId),
        evaluateAbsoluteAchievements(tenantId),
      ]);
      const created = [...streaks, ...monthly, ...recovery, ...milestones, ...absolutes];
      totalCreated += created.length;
      summary.push({ tenantId, created });
    } catch (err) {
      summary.push({
        tenantId,
        created: [],
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    tenantsProcessed: (tenants ?? []).length,
    achievementsCreated: totalCreated,
    durationMs: Date.now() - startedAt,
    summary,
  });
}
