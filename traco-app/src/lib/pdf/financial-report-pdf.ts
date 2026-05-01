import 'server-only';

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const GOLD = rgb(0.79, 0.66, 0.38);
const INK = rgb(0.04, 0.04, 0.04);
const MUTED = rgb(0.45, 0.45, 0.45);
const CREAM_DARK = rgb(0.91, 0.9, 0.87);
const RED = rgb(0.69, 0.13, 0.13);
const GREEN = rgb(0.18, 0.6, 0.32);

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;

type RevenueRow = {
  date: string;
  client: string;
  procedure: string;
  price: number;
};

type ExpenseRow = {
  date: string;
  category: string;
  description: string;
  amount: number;
};

type CategoryRow = {
  category: string;
  amount: number;
  percentage: number;
};

export type FinancialReportArgs = {
  studioName: string;
  designerName: string;
  periodLabel: string;
  totals: {
    revenue: number;
    expenses: number;
    profit: number;
    margin: number;
    appointments: number;
    expenseCount: number;
  };
  revenues: RevenueRow[];
  expenses: ExpenseRow[];
  expensesByCategory: CategoryRow[];
};

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export async function buildFinancialReportPDF(
  args: FinancialReportArgs,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  }

  function drawText(text: string, opts?: {
    font?: typeof regular;
    size?: number;
    color?: ReturnType<typeof rgb>;
    x?: number;
  }) {
    const f = opts?.font ?? regular;
    const size = opts?.size ?? 10;
    page.drawText(text, {
      x: opts?.x ?? MARGIN,
      y,
      size,
      font: f,
      color: opts?.color ?? INK,
    });
  }

  function drawLine(color = CREAM_DARK) {
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_W - MARGIN, y },
      thickness: 0.5,
      color,
    });
  }

  // --- HEADER ---
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 80,
    width: PAGE_W,
    height: 80,
    color: INK,
  });
  page.drawText('Traço', {
    x: MARGIN,
    y: PAGE_H - 45,
    size: 22,
    font: bold,
    color: GOLD,
  });
  page.drawText('Relatório financeiro', {
    x: MARGIN,
    y: PAGE_H - 65,
    size: 9,
    font: regular,
    color: rgb(1, 1, 1),
  });

  page.drawText(args.studioName, {
    x: PAGE_W - MARGIN - bold.widthOfTextAtSize(args.studioName, 11),
    y: PAGE_H - 45,
    size: 11,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(args.designerName, {
    x: PAGE_W - MARGIN - regular.widthOfTextAtSize(args.designerName, 9),
    y: PAGE_H - 65,
    size: 9,
    font: regular,
    color: GOLD,
  });

  y = PAGE_H - 110;

  // --- PERIOD ---
  drawText('PERÍODO', { font: bold, size: 9, color: MUTED });
  y -= 14;
  drawText(args.periodLabel, { font: regular, size: 14, color: INK });
  y -= 28;

  // --- RESUMO ---
  drawText('RESUMO', { font: bold, size: 9, color: GOLD });
  y -= 6;
  drawLine(GOLD);
  y -= 18;

  const summaryRows: Array<{ label: string; value: string; color?: ReturnType<typeof rgb> }> = [
    { label: 'Receita total', value: BRL.format(args.totals.revenue), color: GREEN },
    { label: 'Despesa total', value: BRL.format(args.totals.expenses), color: RED },
    {
      label: 'Lucro líquido',
      value: BRL.format(args.totals.profit),
      color: args.totals.profit >= 0 ? GREEN : RED,
    },
    {
      label: 'Margem',
      value: `${args.totals.margin.toFixed(1)}%`,
      color: args.totals.margin >= 50 ? GREEN : args.totals.margin >= 30 ? GOLD : RED,
    },
    { label: 'Atendimentos no período', value: String(args.totals.appointments) },
    { label: 'Despesas registradas', value: String(args.totals.expenseCount) },
  ];

  for (const row of summaryRows) {
    ensureSpace(22);
    page.drawText(row.label, { x: MARGIN, y, size: 10, font: regular, color: MUTED });
    const valueWidth = bold.widthOfTextAtSize(row.value, 11);
    page.drawText(row.value, {
      x: PAGE_W - MARGIN - valueWidth,
      y,
      size: 11,
      font: bold,
      color: row.color ?? INK,
    });
    y -= 16;
  }

  y -= 14;

  // --- DESPESAS POR CATEGORIA ---
  if (args.expensesByCategory.length > 0) {
    ensureSpace(60);
    drawText('DESPESAS POR CATEGORIA', { font: bold, size: 9, color: GOLD });
    y -= 6;
    drawLine(GOLD);
    y -= 18;

    for (const row of args.expensesByCategory) {
      ensureSpace(20);
      const valueText = `${BRL.format(row.amount)}  ·  ${row.percentage.toFixed(1)}%`;
      page.drawText(row.category, { x: MARGIN, y, size: 10, font: regular, color: INK });
      const valueWidth = regular.widthOfTextAtSize(valueText, 10);
      page.drawText(valueText, {
        x: PAGE_W - MARGIN - valueWidth,
        y,
        size: 10,
        font: regular,
        color: MUTED,
      });
      y -= 14;
      // simple bar
      const barW = (PAGE_W - 2 * MARGIN) * (row.percentage / 100);
      page.drawRectangle({
        x: MARGIN,
        y: y + 2,
        width: barW,
        height: 3,
        color: RED,
      });
      y -= 14;
    }
    y -= 8;
  }

  // --- TABELA RECEITAS ---
  ensureSpace(40);
  drawText('RECEITAS DETALHADAS', { font: bold, size: 9, color: GOLD });
  y -= 6;
  drawLine(GOLD);
  y -= 16;

  drawTableHeader(['Data', 'Cliente', 'Procedimento', 'Valor']);
  y -= 14;

  for (const r of args.revenues) {
    ensureSpace(14);
    drawTableRow([
      formatBR(r.date),
      truncate(r.client, 24),
      truncate(r.procedure, 22),
      BRL.format(r.price),
    ], 'right-last');
    y -= 14;
  }

  if (args.revenues.length === 0) {
    drawText('Nenhuma receita no período.', { font: italic, size: 10, color: MUTED });
    y -= 16;
  } else {
    y -= 4;
    drawLine(CREAM_DARK);
    y -= 14;
    drawTableRow([
      'TOTAL',
      `${args.revenues.length} atendimento(s)`,
      '',
      BRL.format(args.totals.revenue),
    ], 'right-last', bold, GREEN);
    y -= 14;
  }

  y -= 14;

  // --- TABELA DESPESAS ---
  ensureSpace(40);
  drawText('DESPESAS DETALHADAS', { font: bold, size: 9, color: GOLD });
  y -= 6;
  drawLine(GOLD);
  y -= 16;

  drawTableHeader(['Data', 'Categoria', 'Descrição', 'Valor']);
  y -= 14;

  for (const e of args.expenses) {
    ensureSpace(14);
    drawTableRow([
      formatBR(e.date),
      truncate(e.category, 18),
      truncate(e.description, 28),
      BRL.format(e.amount),
    ], 'right-last');
    y -= 14;
  }

  if (args.expenses.length === 0) {
    drawText('Nenhuma despesa no período.', { font: italic, size: 10, color: MUTED });
    y -= 16;
  } else {
    y -= 4;
    drawLine(CREAM_DARK);
    y -= 14;
    drawTableRow([
      'TOTAL',
      `${args.expenses.length} lançamento(s)`,
      '',
      BRL.format(args.totals.expenses),
    ], 'right-last', bold, RED);
    y -= 14;
  }

  // --- FOOTER ---
  const totalPages = pdf.getPageCount();
  for (let i = 0; i < totalPages; i += 1) {
    const p = pdf.getPage(i);
    p.drawLine({
      start: { x: MARGIN, y: 50 },
      end: { x: PAGE_W - MARGIN, y: 50 },
      thickness: 0.5,
      color: CREAM_DARK,
    });
    const generatedAt = new Date().toLocaleString('pt-BR');
    p.drawText(`Gerado em ${generatedAt} · Traço`, {
      x: MARGIN,
      y: 36,
      size: 8,
      font: regular,
      color: MUTED,
    });
    const pageLabel = `Página ${i + 1} de ${totalPages}`;
    p.drawText(pageLabel, {
      x: PAGE_W - MARGIN - regular.widthOfTextAtSize(pageLabel, 8),
      y: 36,
      size: 8,
      font: regular,
      color: MUTED,
    });
  }

  return await pdf.save();

  // ---- helpers ----
  function drawTableHeader(cols: string[]) {
    ensureSpace(20);
    const widths = [70, 150, 200, 80];
    let x = MARGIN;
    for (let i = 0; i < cols.length; i += 1) {
      const w = widths[i];
      const text = cols[i];
      const isLast = i === cols.length - 1;
      const xText = isLast ? x + w - bold.widthOfTextAtSize(text, 8) : x;
      page.drawText(text, {
        x: xText,
        y,
        size: 8,
        font: bold,
        color: MUTED,
      });
      x += w;
    }
  }

  function drawTableRow(
    cols: string[],
    align: 'left' | 'right-last' = 'left',
    fnt: typeof regular = regular,
    color: ReturnType<typeof rgb> = INK,
  ) {
    const widths = [70, 150, 200, 80];
    let x = MARGIN;
    for (let i = 0; i < cols.length; i += 1) {
      const w = widths[i];
      const text = cols[i];
      const isLast = i === cols.length - 1;
      const xText =
        align === 'right-last' && isLast
          ? x + w - fnt.widthOfTextAtSize(text, 9)
          : x;
      page.drawText(text, {
        x: xText,
        y,
        size: 9,
        font: fnt,
        color,
      });
      x += w;
    }
  }

  function formatBR(iso: string): string {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1].slice(2)}`;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(2);
    return `${dd}/${mm}/${yy}`;
  }

  function truncate(text: string, max: number): string {
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
  }
}
