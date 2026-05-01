import { NextResponse } from 'next/server';

import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron diário (07h UTC = 04h BRT, depois do detect-achievements).
 * Materializa expenses recorrentes cujo next_due_date chegou.
 *
 * Idempotência: UNIQUE(recurrence_id, date) na tabela expenses garante que
 * chamar 2x no mesmo dia não duplica. UPSERT com ignoreDuplicates fecha o ciclo.
 */

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function calcNextDueDate(
  current: string,
  pattern: { type?: string; day?: number } | null,
): string {
  const date = new Date(`${current}T00:00:00`);
  const type = (pattern?.type ?? 'monthly').toLowerCase();
  switch (type) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'monthly':
    default:
      date.setMonth(date.getMonth() + 1);
      break;
  }
  // Se o pattern especifica um dia do mês (ex: dia 5), ajusta
  if (typeof pattern?.day === 'number' && pattern.day >= 1 && pattern.day <= 31) {
    const targetDay = pattern.day;
    // Cuida de meses curtos (28/29/30) — usa último dia se não couber
    const tentative = new Date(date.getFullYear(), date.getMonth(), targetDay);
    if (tentative.getMonth() !== date.getMonth()) {
      // dia inválido pra esse mês, usa último dia do mês
      tentative.setDate(0);
    }
    return isoDate(tentative);
  }
  return isoDate(date);
}

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'CRON_SECRET não configurado.' },
      { status: 500 },
    );
  }
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = isoDate(new Date());
  const startedAt = Date.now();

  // Busca recorrências devidas (ativas + next_due_date <= hoje)
  const { data: recurrences, error: recError } = await supabase
    .from('expense_recurrences')
    .select(
      'id, tenant_id, parent_expense_id, next_due_date, expenses!parent_expense_id(category, description, amount, notes, linked_product_id, recurrence_pattern)',
    )
    .eq('is_active', true)
    .lte('next_due_date', today);

  if (recError) {
    return NextResponse.json({ error: recError.message }, { status: 500 });
  }

  type ParentExpense = {
    category: 'products' | 'rent' | 'marketing' | 'transport' | 'equipment' | 'tax' | 'other';
    description: string;
    amount: number;
    notes: string | null;
    linked_product_id: string | null;
    recurrence_pattern: { type?: string; day?: number } | null;
  };
  type RawRecurrence = {
    id: string;
    tenant_id: string;
    parent_expense_id: string;
    next_due_date: string;
    expenses: ParentExpense | ParentExpense[] | null;
  };

  const summary: Array<{
    recurrenceId: string;
    tenantId: string;
    expenseCreated: boolean;
    nextDueDate: string;
    error?: string;
  }> = [];
  let created = 0;

  for (const raw of (recurrences ?? []) as unknown as RawRecurrence[]) {
    const parent = Array.isArray(raw.expenses) ? raw.expenses[0] : raw.expenses;
    if (!parent) {
      summary.push({
        recurrenceId: raw.id,
        tenantId: raw.tenant_id,
        expenseCreated: false,
        nextDueDate: raw.next_due_date,
        error: 'parent expense não encontrado',
      });
      continue;
    }

    // Insere despesa do dia. ON CONFLICT (recurrence_id, date) DO NOTHING.
    const { data: inserted, error: insertError } = await supabase
      .from('expenses')
      .upsert(
        {
          tenant_id: raw.tenant_id,
          category: parent.category,
          description: parent.description,
          amount: parent.amount,
          date: today,
          is_recurring: false,
          recurrence_pattern: null,
          recurrence_id: raw.id,
          notes: parent.notes,
          linked_product_id: parent.linked_product_id,
        },
        { onConflict: 'recurrence_id,date', ignoreDuplicates: true },
      )
      .select('id')
      .maybeSingle();

    if (insertError) {
      summary.push({
        recurrenceId: raw.id,
        tenantId: raw.tenant_id,
        expenseCreated: false,
        nextDueDate: raw.next_due_date,
        error: insertError.message,
      });
      continue;
    }

    const wasCreated = Boolean(inserted);
    if (wasCreated) created += 1;

    // Avança next_due_date — sempre, mesmo se expense já existia (idempotência
    // de cron rodando depois de delay/retry).
    const nextDate = calcNextDueDate(today, parent.recurrence_pattern);
    const { error: updateError } = await supabase
      .from('expense_recurrences')
      .update({ next_due_date: nextDate })
      .eq('id', raw.id);

    summary.push({
      recurrenceId: raw.id,
      tenantId: raw.tenant_id,
      expenseCreated: wasCreated,
      nextDueDate: nextDate,
      error: updateError?.message,
    });
  }

  return NextResponse.json({
    ok: true,
    today,
    recurrencesProcessed: (recurrences ?? []).length,
    expensesCreated: created,
    durationMs: Date.now() - startedAt,
    summary,
  });
}
