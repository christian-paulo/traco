'use client';

import { CheckCircle2, FileText, ShieldAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/format';

import type { FichaState } from '../atendimento-layout';

type Props = {
  ficha: FichaState;
};

type RawField = {
  type?: string;
  key?: string;
  label?: string;
  options?: Array<{ value: string; label: string }>;
};

type RawSection = {
  type: 'section';
  id?: string;
  label?: string;
  title?: string;
  subtitle?: string;
};

function isSection(field: Record<string, unknown>): field is RawSection {
  return field.type === 'section';
}

function sectionTitle(s: RawSection): string {
  return s.label ?? s.title ?? 'Seção';
}

function isYes(v: unknown): boolean {
  if (v === true || v === 'true' || v === 'sim' || v === 'Sim') return true;
  if (typeof v === 'object' && v !== null) {
    const o = v as { value?: unknown };
    return o.value === true;
  }
  return false;
}

function renderAnswer(field: RawField, answers: Record<string, unknown>): string {
  const key = field.key;
  if (!key) return '—';
  const value = answers[key];
  if (value === undefined || value === null || value === '') return '—';

  if (field.type === 'boolean') {
    return isYes(value) ? 'Sim' : 'Não';
  }

  if (field.type === 'boolean_with_text') {
    if (typeof value === 'object' && value !== null) {
      const o = value as { value?: unknown; text?: string };
      const yes = o.value === true;
      if (!yes) return 'Não';
      return o.text?.trim() ? `Sim — ${o.text}` : 'Sim';
    }
    return isYes(value) ? 'Sim' : 'Não';
  }

  if (field.type === 'select' && Array.isArray(field.options)) {
    const opt = field.options.find((o) => o.value === value);
    return opt?.label ?? String(value);
  }

  if (field.type === 'date' && typeof value === 'string') {
    return formatDate(value, 'short');
  }

  if (field.type === 'term_acceptance') {
    if (typeof value === 'object' && value !== null) {
      const o = value as { accepted?: boolean; signed_at?: string };
      if (o.accepted) {
        return o.signed_at ? `Aceito em ${formatDate(o.signed_at, 'short')}` : 'Aceito';
      }
      return 'Não aceito';
    }
    return isYes(value) ? 'Aceito' : 'Não aceito';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return JSON.stringify(value);
}

export function TabFicha({ ficha }: Props) {
  if (!ficha.formId) {
    return (
      <Card variant="premium" className="bg-card border-0 ring-1 ring-[var(--border)] py-12">
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--gold)]/10">
            <FileText className="size-8 text-[var(--gold)]" strokeWidth={1.25} />
          </div>
          <p className="font-serif text-lg italic text-muted-foreground">
            Esta cliente ainda não preencheu ficha de anamnese.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Volte ao perfil da cliente e envie o link da ficha antes de prosseguir.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (ficha.templateFields.length === 0) {
    return (
      <Card variant="premium" className="bg-card border-0 ring-1 ring-amber-200 py-8">
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <p className="font-serif text-base italic text-amber-800">
            O template da ficha está sem campos configurados.
          </p>
          <p className="text-xs text-muted-foreground">
            Verifique em Configurações se o template ativo tem perguntas.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Agrupa fields por section
  const sections: Array<{ title: string; fields: RawField[] }> = [];
  let current: { title: string; fields: RawField[] } | null = null;
  for (const f of ficha.templateFields) {
    if (isSection(f)) {
      if (current) sections.push(current);
      current = { title: sectionTitle(f), fields: [] };
    } else {
      if (!current) current = { title: 'Identificação', fields: [] };
      current.fields.push(f as RawField);
    }
  }
  if (current) sections.push(current);

  return (
    <div className="flex flex-col gap-4">
      <Card variant="premium" className="bg-card border-0 ring-1 ring-emerald-200">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-600" />
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-emerald-800">
                Ficha assinada{' '}
                {ficha.signedAt ? `em ${formatDate(ficha.signedAt, 'short')}` : ''}
              </p>
              {ficha.editCount > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {ficha.editCount}{' '}
                  {ficha.editCount === 1 ? 'edição posterior' : 'edições posteriores'}
                </p>
              ) : null}
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-cream-dark text-xs uppercase tracking-[0.14em] text-muted-foreground"
          >
            <ShieldAlert className="size-3" />
            Apenas leitura
          </Badge>
        </CardContent>
      </Card>

      {sections.map((section, idx) => (
        <Card
          key={`${section.title}-${idx}`}
          variant="premium"
          className="bg-card border-0 ring-1 ring-[var(--border)]"
        >
          <CardContent className="flex flex-col gap-3 px-6 py-5">
            <p className="font-serif text-lg font-medium text-foreground">
              {section.title}
            </p>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {section.fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-0.5">
                  <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {field.label ?? field.key}
                  </dt>
                  <dd className="break-words text-sm text-foreground">
                    {renderAnswer(field, ficha.currentAnswers)}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
