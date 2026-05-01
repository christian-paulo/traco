'use server';

import ExcelJS from 'exceljs';
import { z } from 'zod';

import { buildFinancialReportPDF } from '@/lib/pdf/financial-report-pdf';
import { listExpenses } from '@/lib/queries/expenses';
import { getCurrentProfile } from '@/lib/queries/profile';
import { getCurrentStudio } from '@/lib/queries/studio';
import { createClient } from '@/lib/supabase/server';
import { EXPENSE_CATEGORY_LABELS } from '@/lib/validations/expense';

type ExportResult =
  | { success: true; data: { base64: string; filename: string } }
  | { success: false; error: string };

const exportArgsSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inicial inválida.'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final inválida.'),
});

type ExportArgs = z.input<typeof exportArgsSchema>;

type RevenueRow = {
  id: string;
  date: string;
  client: string;
  procedure: string;
  price: number;
};

type ExpenseExportRow = {
  date: string;
  category: string;
  description: string;
  amount: number;
};

async function loadFinancialData(
  from: string,
  to: string,
): Promise<{
  revenues: RevenueRow[];
  expenses: ExpenseExportRow[];
  totals: {
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
    appointments: number;
    expenseCount: number;
  };
  expensesByCategory: Array<{ category: string; amount: number; percentage: number }>;
  studioName: string;
  designerName: string;
} | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const studio = await getCurrentStudio();
  const supabase = await createClient();

  const fromIso = `${from}T00:00:00.000Z`;
  const toIso = `${to}T23:59:59.999Z`;

  const [{ data: appts }, expensesRows] = await Promise.all([
    supabase
      .from('appointments')
      .select(
        'id, performed_at, price, status, clients(full_name), procedures(name)',
      )
      .gte('performed_at', fromIso)
      .lte('performed_at', toIso)
      .order('performed_at', { ascending: true }),
    listExpenses({ from, to }),
  ]);

  type RawApptClient = { full_name?: string };
  type RawApptProc = { name?: string };
  const revenues: RevenueRow[] = (appts ?? [])
    .filter((r) => {
      const status = (r as { status?: string }).status;
      return status !== 'cancelled' && status !== 'no_show';
    })
    .map((r) => {
      const c = r.clients as RawApptClient | RawApptClient[] | null;
      const cObj = Array.isArray(c) ? c[0] : c;
      const p = r.procedures as RawApptProc | RawApptProc[] | null;
      const pObj = Array.isArray(p) ? p[0] : p;
      return {
        id: r.id as string,
        date: r.performed_at as string,
        client: cObj?.full_name ?? 'Cliente',
        procedure: pObj?.name ?? 'Procedimento',
        price: Number(r.price ?? 0),
      } satisfies RevenueRow;
    });

  const expenses: ExpenseExportRow[] = expensesRows.map((e) => ({
    date: e.date,
    category: EXPENSE_CATEGORY_LABELS[e.category],
    description: e.description,
    amount: Number(e.amount ?? 0),
  }));

  const revenue = revenues.reduce((s, r) => s + r.price, 0);
  const expensesTotal = expenses.reduce((s, r) => s + r.amount, 0);
  const profit = revenue - expensesTotal;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const byCat = new Map<string, number>();
  for (const e of expenses) {
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  }
  const expensesByCategory = Array.from(byCat.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: expensesTotal > 0 ? (amount / expensesTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    revenues,
    expenses,
    totals: {
      revenue,
      expenses: expensesTotal,
      profit,
      margin,
      appointments: revenues.length,
      expenseCount: expenses.length,
    },
    expensesByCategory,
    studioName: studio?.name ?? 'Studio',
    designerName: profile.fullName ?? 'Designer',
  };
}

function formatPeriodLabel(from: string, to: string): string {
  const fmt = (iso: string) => {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
  };
  return `${fmt(from)} – ${fmt(to)}`;
}

export async function generateFinancialReportPDF(
  input: ExportArgs,
): Promise<ExportResult> {
  const parsed = exportArgsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = await loadFinancialData(parsed.data.from, parsed.data.to);
  if (!data) return { success: false, error: 'Sessão expirada.' };

  const bytes = await buildFinancialReportPDF({
    studioName: data.studioName,
    designerName: data.designerName,
    periodLabel: formatPeriodLabel(parsed.data.from, parsed.data.to),
    totals: data.totals,
    revenues: data.revenues,
    expenses: data.expenses,
    expensesByCategory: data.expensesByCategory,
  });

  const base64 = Buffer.from(bytes).toString('base64');
  const filename = `traco-financeiro-${parsed.data.from}-${parsed.data.to}.pdf`;
  return { success: true, data: { base64, filename } };
}

const BRL_FMT = '_-R$ * #,##0.00_-;-R$ * #,##0.00_-;_-R$ * "-"??_-;_-@_-';

export async function generateFinancialReportExcel(
  input: ExportArgs,
): Promise<ExportResult> {
  const parsed = exportArgsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const data = await loadFinancialData(parsed.data.from, parsed.data.to);
  if (!data) return { success: false, error: 'Sessão expirada.' };

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Traço';
  wb.created = new Date();

  // ---- Aba 1: Resumo ----
  const summary = wb.addWorksheet('Resumo');
  summary.columns = [
    { header: 'Métrica', key: 'metric', width: 32 },
    { header: 'Valor', key: 'value', width: 22 },
  ];
  summary.getRow(1).font = { bold: true };
  summary.addRows([
    { metric: 'Studio', value: data.studioName },
    { metric: 'Designer', value: data.designerName },
    { metric: 'Período', value: formatPeriodLabel(parsed.data.from, parsed.data.to) },
    { metric: '', value: '' },
    { metric: 'Receita total', value: data.totals.revenue },
    { metric: 'Despesa total', value: data.totals.expenses },
    { metric: 'Lucro líquido', value: data.totals.profit },
    { metric: 'Margem (%)', value: Number(data.totals.margin.toFixed(2)) },
    { metric: 'Atendimentos', value: data.totals.appointments },
    { metric: 'Despesas registradas', value: data.totals.expenseCount },
  ]);
  for (let r = 5; r <= 7; r += 1) {
    summary.getCell(`B${r}`).numFmt = BRL_FMT;
  }

  if (data.expensesByCategory.length > 0) {
    summary.addRow({});
    const headerRow = summary.addRow({ metric: 'Categoria', value: 'Total' });
    headerRow.font = { bold: true };
    for (const c of data.expensesByCategory) {
      const row = summary.addRow({ metric: c.category, value: c.amount });
      row.getCell('B').numFmt = BRL_FMT;
    }
  }

  // ---- Aba 2: Receitas ----
  const revenuesSheet = wb.addWorksheet('Receitas');
  revenuesSheet.columns = [
    { header: 'Data', key: 'date', width: 14 },
    { header: 'Cliente', key: 'client', width: 32 },
    { header: 'Procedimento', key: 'procedure', width: 28 },
    { header: 'Valor', key: 'price', width: 16 },
  ];
  revenuesSheet.getRow(1).font = { bold: true };
  for (const r of data.revenues) {
    revenuesSheet.addRow({
      date: r.date.slice(0, 10),
      client: r.client,
      procedure: r.procedure,
      price: r.price,
    });
  }
  revenuesSheet.getColumn('price').numFmt = BRL_FMT;
  if (data.revenues.length > 0) {
    revenuesSheet.addRow({});
    const totalRow = revenuesSheet.addRow({
      date: '',
      client: 'TOTAL',
      procedure: '',
      price: data.totals.revenue,
    });
    totalRow.font = { bold: true };
    totalRow.getCell('price').numFmt = BRL_FMT;
  }

  // ---- Aba 3: Despesas ----
  const expensesSheet = wb.addWorksheet('Despesas');
  expensesSheet.columns = [
    { header: 'Data', key: 'date', width: 14 },
    { header: 'Categoria', key: 'category', width: 22 },
    { header: 'Descrição', key: 'description', width: 40 },
    { header: 'Valor', key: 'amount', width: 16 },
  ];
  expensesSheet.getRow(1).font = { bold: true };
  for (const e of data.expenses) {
    expensesSheet.addRow({
      date: e.date,
      category: e.category,
      description: e.description,
      amount: e.amount,
    });
  }
  expensesSheet.getColumn('amount').numFmt = BRL_FMT;
  if (data.expenses.length > 0) {
    expensesSheet.addRow({});
    const totalRow = expensesSheet.addRow({
      date: '',
      category: 'TOTAL',
      description: '',
      amount: data.totals.expenses,
    });
    totalRow.font = { bold: true };
    totalRow.getCell('amount').numFmt = BRL_FMT;
  }

  const buffer = await wb.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const filename = `traco-financeiro-${parsed.data.from}-${parsed.data.to}.xlsx`;
  return { success: true, data: { base64, filename } };
}
