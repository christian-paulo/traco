import 'server-only';

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const GOLD = rgb(0.79, 0.66, 0.38);
const INK = rgb(0.04, 0.04, 0.04);
const MUTED = rgb(0.45, 0.45, 0.45);
const CREAM_DARK = rgb(0.91, 0.9, 0.87);
const WHITE = rgb(1, 1, 1);

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;

type AnamnesisField = {
  id: string;
  type: 'text' | 'textarea' | 'date' | 'boolean' | 'select';
  label: string;
  options?: string[];
  required?: boolean;
};

type Args = {
  form: {
    id: string;
    answers: Record<string, unknown> | null;
    signature_png: string | null;
    signed_at: string | null;
    signer_ip: string | null;
    integrity_hash: string | null;
  };
  client: {
    full_name: string;
    phone: string;
    email: string | null;
    birth_date: string | null;
  };
  template: {
    name: string;
    fields: AnamnesisField[];
  };
  designerName: string;
};

function dataUrlToBytes(dataUrl: string): Uint8Array | null {
  const match = dataUrl.match(/^data:image\/(png|jpeg);base64,(.*)$/i);
  if (!match) return null;
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');
  return new Uint8Array(buffer);
}

function formatDateBR(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function formatBirthDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

function formatAnswer(field: AnamnesisField, raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return '—';
  if (field.type === 'boolean') {
    if (raw === true || raw === 'true' || raw === 'sim' || raw === 'Sim') return 'Sim';
    if (raw === false || raw === 'false' || raw === 'nao' || raw === 'Não' || raw === 'não') {
      return 'Não';
    }
    return String(raw);
  }
  if (field.type === 'date' && typeof raw === 'string') {
    return formatBirthDate(raw);
  }
  return String(raw);
}

export async function generateAnamnesisPDF({
  form,
  client,
  template,
  designerName,
}: Args): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const helveticaItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H;

  function addPageBreak() {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }

  // Header preto
  page.drawRectangle({
    x: 0,
    y: PAGE_H - 110,
    width: PAGE_W,
    height: 110,
    color: INK,
  });
  page.drawText('TRAÇO', {
    x: MARGIN,
    y: PAGE_H - 60,
    size: 30,
    font: helveticaBold,
    color: GOLD,
  });
  page.drawText('BY MASTER BROW', {
    x: MARGIN,
    y: PAGE_H - 80,
    size: 8,
    font: helvetica,
    color: rgb(1, 1, 1),
  });
  page.drawRectangle({
    x: MARGIN,
    y: PAGE_H - 95,
    width: 40,
    height: 1.5,
    color: GOLD,
  });

  // Documento ID no canto
  page.drawText(`#${form.id.slice(0, 8).toUpperCase()}`, {
    x: PAGE_W - MARGIN - 80,
    y: PAGE_H - 60,
    size: 10,
    font: helvetica,
    color: rgb(0.7, 0.7, 0.7),
  });

  y = PAGE_H - 150;

  // Título
  page.drawText('Ficha de Anamnese', {
    x: MARGIN,
    y,
    size: 22,
    font: helveticaBold,
    color: INK,
  });
  y -= 14;
  page.drawText(template.name.toUpperCase(), {
    x: MARGIN,
    y,
    size: 8,
    font: helvetica,
    color: MUTED,
  });
  y -= 30;

  // Metadata em duas colunas
  const colLeftX = MARGIN;
  const colRightX = PAGE_W / 2 + 10;
  const labelSize = 7;
  const valueSize = 10;

  function drawMeta(x: number, yPos: number, label: string, value: string) {
    page.drawText(label.toUpperCase(), {
      x,
      y: yPos,
      size: labelSize,
      font: helveticaBold,
      color: MUTED,
    });
    page.drawText(value || '—', {
      x,
      y: yPos - 12,
      size: valueSize,
      font: helvetica,
      color: INK,
    });
  }

  drawMeta(colLeftX, y, 'Cliente', client.full_name);
  drawMeta(colRightX, y, 'Designer', designerName);
  y -= 32;

  drawMeta(colLeftX, y, 'WhatsApp', client.phone);
  drawMeta(
    colRightX,
    y,
    'Data da assinatura',
    form.signed_at ? formatDateBR(form.signed_at) : '—',
  );
  y -= 32;

  drawMeta(
    colLeftX,
    y,
    'Data de nascimento',
    client.birth_date ? formatBirthDate(client.birth_date) : '—',
  );
  drawMeta(colRightX, y, 'Email', client.email ?? '—');
  y -= 36;

  // Linha divisória dourada
  page.drawRectangle({ x: MARGIN, y, width: 24, height: 1, color: GOLD });
  y -= 24;

  // Q&A
  page.drawText('RESPOSTAS', {
    x: MARGIN,
    y,
    size: 9,
    font: helveticaBold,
    color: MUTED,
  });
  y -= 18;

  const answers = (form.answers ?? {}) as Record<string, unknown>;
  const maxWidth = PAGE_W - MARGIN * 2;

  function drawWrapped(
    text: string,
    x: number,
    yStart: number,
    size: number,
    font: typeof helvetica,
    color: ReturnType<typeof rgb>,
    lineHeight = 1.35,
  ): number {
    const words = text.split(/\s+/);
    let line = '';
    let cursor = yStart;
    const lh = size * lineHeight;
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, size);
      if (width > maxWidth - (x - MARGIN) && line) {
        page.drawText(line, { x, y: cursor, size, font, color });
        cursor -= lh;
        if (cursor < MARGIN + 80) {
          addPageBreak();
          cursor = y;
        }
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) {
      page.drawText(line, { x, y: cursor, size, font, color });
      cursor -= lh;
    }
    return cursor;
  }

  for (const field of template.fields) {
    if (y < MARGIN + 130) {
      addPageBreak();
    }
    page.drawText(field.label, {
      x: MARGIN,
      y,
      size: 10,
      font: helveticaBold,
      color: INK,
    });
    y -= 14;
    const answerText = formatAnswer(field, answers[field.id]);
    y = drawWrapped(answerText, MARGIN + 8, y, 10, helvetica, MUTED, 1.4);
    y -= 8;
  }

  y -= 16;

  // Bloco de assinatura
  if (y < MARGIN + 200) addPageBreak();

  page.drawText('ASSINATURA DIGITAL', {
    x: MARGIN,
    y,
    size: 9,
    font: helveticaBold,
    color: MUTED,
  });
  y -= 14;

  const sigBoxW = 240;
  const sigBoxH = 90;
  page.drawRectangle({
    x: MARGIN,
    y: y - sigBoxH,
    width: sigBoxW,
    height: sigBoxH,
    color: WHITE,
    borderColor: CREAM_DARK,
    borderWidth: 1,
  });

  if (form.signature_png) {
    const bytes = dataUrlToBytes(form.signature_png);
    if (bytes) {
      try {
        const img = await pdf.embedPng(bytes);
        const ratio = img.width / img.height;
        const targetH = sigBoxH - 16;
        const targetW = Math.min(sigBoxW - 16, targetH * ratio);
        const finalH = targetW / ratio;
        page.drawImage(img, {
          x: MARGIN + (sigBoxW - targetW) / 2,
          y: y - sigBoxH + (sigBoxH - finalH) / 2,
          width: targetW,
          height: finalH,
        });
      } catch {
        // ignore embed failure
      }
    }
  }

  page.drawRectangle({
    x: MARGIN,
    y: y - sigBoxH - 6,
    width: sigBoxW,
    height: 1,
    color: GOLD,
  });

  y -= sigBoxH + 16;

  // Metadados de integridade
  const meta = [
    `Assinado em: ${form.signed_at ? formatDateBR(form.signed_at) : '—'}`,
    `IP de assinatura: ${form.signer_ip ?? '—'}`,
    `Hash de integridade: ${form.integrity_hash ?? '—'}`,
  ];
  for (const line of meta) {
    if (y < MARGIN + 60) addPageBreak();
    page.drawText(line, {
      x: MARGIN,
      y,
      size: 8,
      font: helvetica,
      color: MUTED,
    });
    y -= 12;
  }

  // Footer
  const footerY = MARGIN - 6;
  page.drawRectangle({
    x: MARGIN,
    y: footerY + 18,
    width: 24,
    height: 1,
    color: GOLD,
  });
  page.drawText(
    'Documento gerado eletronicamente — tem validade jurídica conforme MP 2.200-2/2001',
    {
      x: MARGIN,
      y: footerY,
      size: 7,
      font: helveticaItalic,
      color: MUTED,
    },
  );

  return await pdf.save();
}
