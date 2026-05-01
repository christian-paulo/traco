import 'server-only';

import { createClient } from '@/lib/supabase/server';
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from '@/lib/validations/expense';

export type ExpenseRow = {
  id: string;
  tenant_id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  is_recurring: boolean;
  recurrence_pattern: { type?: string; day?: number } | null;
  receipt_url: string | null;
  notes: string | null;
  linked_product_id: string | null;
  created_at: string;
  updated_at: string;
};

type ListArgs = {
  from?: string;
  to?: string;
  category?: ExpenseCategory | 'all';
  search?: string;
};

export async function listExpenses(args: ListArgs = {}): Promise<ExpenseRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from('expenses')
    .select(
      'id, tenant_id, category, description, amount, date, is_recurring, recurrence_pattern, receipt_url, notes, linked_product_id, created_at, updated_at',
    )
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (args.from) q = q.gte('date', args.from);
  if (args.to) q = q.lte('date', args.to);
  if (args.category && args.category !== 'all') q = q.eq('category', args.category);
  if (args.search && args.search.trim()) {
    q = q.ilike('description', `%${args.search.trim()}%`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as unknown as ExpenseRow[]).map((r) => ({
    ...r,
    amount: Number(r.amount ?? 0),
  }));
}

export type ExpenseSummary = {
  total: number;
  count: number;
  averageMonthly: number;
  byCategory: Array<{
    category: ExpenseCategory;
    label: string;
    amount: number;
    percentage: number;
  }>;
  topCategory: { category: ExpenseCategory; label: string; amount: number } | null;
};

import { EXPENSE_CATEGORY_LABELS } from '@/lib/validations/expense';

function monthsBetween(from: string, to: string): number {
  const f = new Date(`${from}T00:00:00`);
  const t = new Date(`${to}T23:59:59`);
  const diffMs = t.getTime() - f.getTime();
  const months = diffMs / (1000 * 60 * 60 * 24 * 30.4375);
  return Math.max(months, 1);
}

export async function getExpenseSummary(args: {
  from: string;
  to: string;
}): Promise<ExpenseSummary> {
  const rows = await listExpenses({ from: args.from, to: args.to });

  let total = 0;
  const byCat = new Map<ExpenseCategory, number>();
  for (const cat of EXPENSE_CATEGORIES) byCat.set(cat, 0);

  for (const r of rows) {
    total += r.amount;
    byCat.set(r.category, (byCat.get(r.category) ?? 0) + r.amount);
  }

  const months = monthsBetween(args.from, args.to);
  const averageMonthly = total / months;

  const byCategory = Array.from(byCat.entries())
    .map(([category, amount]) => ({
      category,
      label: EXPENSE_CATEGORY_LABELS[category],
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const topCategory = byCategory[0] ?? null;
  return {
    total,
    count: rows.length,
    averageMonthly,
    byCategory,
    topCategory: topCategory
      ? { category: topCategory.category, label: topCategory.label, amount: topCategory.amount }
      : null,
  };
}

export type RecurringExpenseCreatedToday = {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
};

export async function listRecurringExpensesCreatedToday(): Promise<RecurringExpenseCreatedToday[]> {
  const supabase = await createClient();
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const { data } = await supabase
    .from('expenses')
    .select('id, description, amount, category')
    .not('recurrence_id', 'is', null)
    .eq('date', todayIso);
  return ((data ?? []) as unknown as RecurringExpenseCreatedToday[]).map((r) => ({
    ...r,
    amount: Number(r.amount ?? 0),
  }));
}

export async function getMonthlyExpenseComparison(months = 6): Promise<
  Array<{ month: string; label: string; amount: number }>
> {
  const supabase = await createClient();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const startKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`;

  const { data } = await supabase
    .from('expenses')
    .select('date, amount')
    .gte('date', startKey);

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, 0);
  }

  for (const row of data ?? []) {
    const d = new Date(`${row.date}T00:00:00`);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + Number(row.amount ?? 0));
    }
  }

  const labelFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' });
  return Array.from(buckets.entries()).map(([month, amount]) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    const label = labelFmt.format(d).replace('.', '');
    return {
      month,
      label: label.replace(/^(\w)/, (c) => c.toUpperCase()),
      amount,
    };
  });
}
