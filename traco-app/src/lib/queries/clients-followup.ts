import 'server-only';

import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

const COMPLETED_STATUSES = ['completed', 'confirmed', 'pending'];

/**
 * Conta retornos atrasados (último atendimento mais antigo que o
 * default_return_days do procedimento). Cacheado por request via React cache().
 * Usado no badge da sidebar e no card de retornos do dashboard.
 */
export const countOverdueReturns = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('appointments')
    .select(
      'client_id, performed_at, return_due_date, procedures(default_return_days)',
    )
    .in('status', COMPLETED_STATUSES)
    .order('performed_at', { ascending: false });

  type Row = {
    client_id: string;
    performed_at: string;
    return_due_date: string | null;
    procedures: { default_return_days: number } | { default_return_days: number }[] | null;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const seen = new Set<string>();
  let count = 0;

  for (const raw of ((data ?? []) as unknown as Row[])) {
    if (seen.has(raw.client_id)) continue;
    seen.add(raw.client_id);

    // Prefere return_due_date se presente; senão calcula via procedure default
    let expectedMs: number | null = null;
    if (raw.return_due_date) {
      expectedMs = new Date(`${raw.return_due_date}T00:00:00`).getTime();
    } else {
      const proc = Array.isArray(raw.procedures) ? raw.procedures[0] : raw.procedures;
      if (proc?.default_return_days) {
        expectedMs = new Date(raw.performed_at).getTime() + proc.default_return_days * 86_400_000;
      }
    }

    if (expectedMs !== null && expectedMs < todayMs) count += 1;
  }

  return count;
});

export type ClientReturnRow = {
  clientId: string;
  fullName: string;
  phone: string;
  lastAppointmentDate: string;
  lastProcedureId: string | null;
  lastProcedureName: string | null;
  lastProcedureColor: string | null;
  expectedReturnDate: string; // YYYY-MM-DD
  daysUntilReturn: number; // negativo = atrasado, positivo = ainda vai
  appointmentsForProcedure: number;
  isOverdue: boolean;
};

/**
 * Clientes que estão por fazer (ou já passaram do) retorno baseado em um
 * intervalo de dias após o último atendimento. Se `procedureId` for passado,
 * filtra só pra esse procedimento e calcula a partir do último atendimento
 * com esse procedimento específico.
 *
 * @param daysAfter - dias após último atendimento pra considerar como "retorno"
 * @param procedureId - opcional: limita à última realização desse procedimento
 * @param windowDays - quão à frente olhar (default: 14 dias)
 */
export async function getClientsForReturn(opts: {
  daysAfter: number;
  procedureId?: string;
  windowDays?: number;
}): Promise<ClientReturnRow[]> {
  const { daysAfter, procedureId, windowDays = 14 } = opts;
  const supabase = await createClient();

  let query = supabase
    .from('appointments')
    .select(
      'id, client_id, performed_at, procedure_id, procedures(id, name, color), clients(id, full_name, phone)',
    )
    .in('status', COMPLETED_STATUSES)
    .order('performed_at', { ascending: false });

  if (procedureId) query = query.eq('procedure_id', procedureId);

  const { data: appts } = await query;

  type Row = {
    id: string;
    client_id: string;
    performed_at: string;
    procedure_id: string | null;
    procedures: { id: string; name: string; color: string } | { id: string; name: string; color: string }[] | null;
    clients: { id: string; full_name: string; phone: string } | { id: string; full_name: string; phone: string }[] | null;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const maxFutureMs = todayMs + windowDays * 86_400_000;

  // Pega o último atendimento de cada client_id (já vem ordenado desc)
  const seen = new Map<string, Row>();
  const procCounts = new Map<string, number>();

  for (const raw of (appts ?? []) as unknown as Row[]) {
    if (!seen.has(raw.client_id)) seen.set(raw.client_id, raw);
    procCounts.set(raw.client_id, (procCounts.get(raw.client_id) ?? 0) + 1);
  }

  const rows: ClientReturnRow[] = [];

  for (const [clientId, raw] of seen.entries()) {
    const lastDate = new Date(raw.performed_at);
    lastDate.setHours(0, 0, 0, 0);
    const expected = new Date(lastDate.getTime() + daysAfter * 86_400_000);
    if (expected.getTime() > maxFutureMs) continue; // muito longe ainda

    const proc = Array.isArray(raw.procedures) ? raw.procedures[0] : raw.procedures;
    const client = Array.isArray(raw.clients) ? raw.clients[0] : raw.clients;
    if (!client) continue;

    const days = Math.floor((expected.getTime() - todayMs) / 86_400_000);
    rows.push({
      clientId,
      fullName: client.full_name,
      phone: client.phone,
      lastAppointmentDate: raw.performed_at,
      lastProcedureId: raw.procedure_id,
      lastProcedureName: proc?.name ?? null,
      lastProcedureColor: proc?.color ?? null,
      expectedReturnDate: expected.toISOString().slice(0, 10),
      daysUntilReturn: days,
      appointmentsForProcedure: procCounts.get(clientId) ?? 1,
      isOverdue: days < 0,
    });
  }

  // Ordem: atrasados primeiro (mais atrasado primeiro), depois próximos a vencer
  return rows.sort((a, b) => a.daysUntilReturn - b.daysUntilReturn);
}

export type MissingClientRow = {
  clientId: string;
  fullName: string;
  phone: string;
  lastAppointmentDate: string;
  daysSinceLast: number;
  appointmentsCount: number;
};

/**
 * Clientes sumidos: sem atendimento há `minDaysSinceLast` ou mais, com pelo
 * menos `minAppointments` atendimentos no histórico (filtro de fidelidade pra
 * descartar clientes que veio uma vez e nunca mais).
 */
export async function getMissingClients(opts: {
  minDaysSinceLast: number;
  minAppointments: number;
}): Promise<MissingClientRow[]> {
  const { minDaysSinceLast, minAppointments } = opts;
  const supabase = await createClient();

  const { data: appts } = await supabase
    .from('appointments')
    .select('client_id, performed_at, clients(id, full_name, phone)')
    .in('status', COMPLETED_STATUSES)
    .order('performed_at', { ascending: false });

  type Row = {
    client_id: string;
    performed_at: string;
    clients: { id: string; full_name: string; phone: string } | { id: string; full_name: string; phone: string }[] | null;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const lastByClient = new Map<string, Row>();
  const countByClient = new Map<string, number>();

  for (const raw of (appts ?? []) as unknown as Row[]) {
    if (!lastByClient.has(raw.client_id)) lastByClient.set(raw.client_id, raw);
    countByClient.set(raw.client_id, (countByClient.get(raw.client_id) ?? 0) + 1);
  }

  const rows: MissingClientRow[] = [];

  for (const [clientId, raw] of lastByClient.entries()) {
    const count = countByClient.get(clientId) ?? 0;
    if (count < minAppointments) continue;
    const lastDate = new Date(raw.performed_at);
    lastDate.setHours(0, 0, 0, 0);
    const days = Math.floor((todayMs - lastDate.getTime()) / 86_400_000);
    if (days < minDaysSinceLast) continue;

    const client = Array.isArray(raw.clients) ? raw.clients[0] : raw.clients;
    if (!client) continue;
    rows.push({
      clientId,
      fullName: client.full_name,
      phone: client.phone,
      lastAppointmentDate: raw.performed_at,
      daysSinceLast: days,
      appointmentsCount: count,
    });
  }

  return rows.sort((a, b) => b.daysSinceLast - a.daysSinceLast);
}
