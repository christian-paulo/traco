import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type {
  ReportType,
  SharingTemplate,
} from '@/lib/validations/sharing';

export type SharingPreferencesRow = {
  id: string;
  tenant_id: string;
  never_show_revenue: boolean;
  never_show_profit: boolean;
  never_show_expenses: boolean;
  default_template: SharingTemplate;
  watermark_enabled: boolean;
  custom_brand_color: string | null;
  created_at: string;
  updated_at: string;
};

export type GeneratedReportRow = {
  id: string;
  tenant_id: string;
  report_type: ReportType;
  period_start: string | null;
  period_end: string | null;
  included_fields: Record<string, unknown>;
  storage_path: string | null;
  image_url: string | null;
  shared_at: string | null;
  created_at: string;
};

export async function getSharingPreferences(): Promise<SharingPreferencesRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sharing_preferences')
    .select('*')
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as SharingPreferencesRow;
}

export async function listGeneratedReports(
  options: { limit?: number; onlyShared?: boolean } = {},
): Promise<GeneratedReportRow[]> {
  const supabase = await createClient();
  const base = supabase
    .from('generated_reports')
    .select('*')
    .order('created_at', { ascending: false });
  const filtered = options.onlyShared ? base.not('shared_at', 'is', null) : base;
  const ranged =
    typeof options.limit === 'number' ? filtered.limit(options.limit) : filtered;
  const { data, error } = await ranged;
  if (error) throw error;
  return (data ?? []) as unknown as GeneratedReportRow[];
}

export type ReportData = {
  appointmentsCount: number;
  hoursWorked: number;
  clientsCount: number;
  topProcedure: { name: string; count: number } | null;
  highlightClient: { name: string; visitsCount: number } | null;
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
};

export async function getReportData(args: {
  periodStart: string;
  periodEnd: string;
}): Promise<ReportData> {
  const supabase = await createClient();
  const fromIso = `${args.periodStart}T00:00:00.000Z`;
  const toIso = `${args.periodEnd}T23:59:59.999Z`;

  const [{ data: appts }, { data: expRows }] = await Promise.all([
    supabase
      .from('appointments')
      .select(
        'id, client_id, performed_at, scheduled_start_at, scheduled_end_at, price, status, procedures(name)',
      )
      .gte('performed_at', fromIso)
      .lte('performed_at', toIso),
    supabase
      .from('expenses')
      .select('amount')
      .gte('date', args.periodStart)
      .lte('date', args.periodEnd),
  ]);

  type RawProc = { name?: string };
  type RawAppt = {
    id: string;
    client_id: string;
    performed_at: string;
    scheduled_start_at: string | null;
    scheduled_end_at: string | null;
    price: number | null;
    status: string;
    procedures: RawProc | RawProc[] | null;
  };

  const valid = (appts ?? [])
    .map((r) => r as unknown as RawAppt)
    .filter((a) => a.status !== 'cancelled' && a.status !== 'no_show');

  const clientsSet = new Set<string>();
  let revenue = 0;
  let totalMinutes = 0;
  const procCounts = new Map<string, number>();

  for (const a of valid) {
    clientsSet.add(a.client_id);
    revenue += Number(a.price ?? 0);

    if (a.scheduled_start_at && a.scheduled_end_at) {
      const start = new Date(a.scheduled_start_at).getTime();
      const end = new Date(a.scheduled_end_at).getTime();
      totalMinutes += Math.max(0, (end - start) / 60_000);
    } else {
      // Fallback: estima 60min se não houver scheduled
      totalMinutes += 60;
    }

    const procRel = a.procedures;
    const proc = Array.isArray(procRel) ? procRel[0] : procRel;
    if (proc?.name) {
      procCounts.set(proc.name, (procCounts.get(proc.name) ?? 0) + 1);
    }
  }

  const sortedProcs = Array.from(procCounts.entries()).sort((a, b) => b[1] - a[1]);
  const topProcedure = sortedProcs[0]
    ? { name: sortedProcs[0][0], count: sortedProcs[0][1] }
    : null;

  // Cliente destaque: a que mais voltou no período
  const clientCounts = new Map<string, number>();
  for (const a of valid) {
    clientCounts.set(a.client_id, (clientCounts.get(a.client_id) ?? 0) + 1);
  }
  const sortedClients = Array.from(clientCounts.entries()).sort((a, b) => b[1] - a[1]);
  let highlightClient: ReportData['highlightClient'] = null;
  if (sortedClients.length > 0 && sortedClients[0][1] >= 1) {
    const [topId, topCount] = sortedClients[0];
    const { data: client } = await supabase
      .from('clients')
      .select('full_name')
      .eq('id', topId)
      .maybeSingle();
    if (client?.full_name) {
      highlightClient = { name: client.full_name, visitsCount: topCount };
    }
  }

  const expenses = (expRows ?? []).reduce(
    (s, r) => s + Number((r as { amount?: number }).amount ?? 0),
    0,
  );
  const profit = revenue - expenses;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    appointmentsCount: valid.length,
    hoursWorked: totalMinutes / 60,
    clientsCount: clientsSet.size,
    topProcedure,
    highlightClient,
    revenue,
    expenses,
    profit,
    profitMargin,
  };
}
