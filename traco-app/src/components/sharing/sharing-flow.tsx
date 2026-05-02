'use client';

import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
  Wand2,
} from 'lucide-react';
import { useMemo, useState, useTransition, type ComponentType } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ReportData } from '@/lib/queries/sharing';
import {
  FIELD_LABELS,
  FINANCIAL_FIELDS,
  type FieldKey,
  type ReportType,
} from '@/lib/validations/sharing';
import { cn } from '@/lib/utils';
import { generateShareableReport } from '@/server/actions/sharing';

import { ReportPreview } from './report-preview';
import { ReportResultDialog } from './report-result-dialog';

const DEFAULT_BRAND = '#C9A961';

type PrefsLite = {
  never_show_revenue: boolean;
  never_show_profit: boolean;
  never_show_expenses: boolean;
  watermark_enabled: boolean;
  custom_brand_color: string | null;
};

type Props = {
  initialData: ReportData;
  preferences: PrefsLite;
  initialReportType?: ReportType;
  initialAchievementLabel?: string;
};

type ReportTypeCard = {
  key: ReportType;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  defaultFields: FieldKey[];
  defaultPeriod: 'today' | 'thisWeek' | 'thisMonth' | 'last7' | 'last30';
};

const TYPE_CARDS: ReportTypeCard[] = [
  {
    key: 'daily',
    label: 'Resumo do dia',
    description: 'Atendimentos e horas de hoje',
    icon: Calendar,
    defaultFields: ['appointments_count', 'hours_worked', 'clients_count'],
    defaultPeriod: 'today',
  },
  {
    key: 'weekly',
    label: 'Resumo da semana',
    description: 'Sua semana inteira',
    icon: CalendarDays,
    defaultFields: ['appointments_count', 'hours_worked', 'clients_count', 'top_procedure'],
    defaultPeriod: 'last7',
  },
  {
    key: 'monthly',
    label: 'Resumo do mês',
    description: 'Marco mensal completo',
    icon: CalendarRange,
    defaultFields: [
      'appointments_count',
      'clients_count',
      'top_procedure',
      'highlight_client',
    ],
    defaultPeriod: 'thisMonth',
  },
  {
    key: 'achievement',
    label: 'Conquista alcançada',
    description: 'Compartilhe um marco importante',
    icon: Sparkles,
    defaultFields: ['goal_achieved', 'motivational_message'],
    defaultPeriod: 'last30',
  },
  {
    key: 'goal_milestone',
    label: 'Marco de meta',
    description: '25/50/75/100% da sua meta',
    icon: Target,
    defaultFields: ['goal_achieved'],
    defaultPeriod: 'thisMonth',
  },
  {
    key: 'custom',
    label: 'Customizado',
    description: 'Você escolhe tudo',
    icon: Wand2,
    defaultFields: ['appointments_count', 'clients_count'],
    defaultPeriod: 'last7',
  },
];

const FIELD_GROUPS: Array<{
  key: 'operational' | 'financial' | 'achievement';
  label: string;
  emoji: string;
  fields: FieldKey[];
  hint?: string;
}> = [
  {
    key: 'operational',
    label: 'Operacional',
    emoji: '📊',
    fields: [
      'appointments_count',
      'hours_worked',
      'clients_count',
      'top_procedure',
      'highlight_client',
    ],
  },
  {
    key: 'financial',
    label: 'Financeiro',
    emoji: '💰',
    fields: ['revenue', 'profit', 'expenses', 'profit_margin'],
    hint: 'Bloqueado por padrão. Ajuste em Configurações → Privacidade.',
  },
  {
    key: 'achievement',
    label: 'Conquistas e mensagens',
    emoji: '🎯',
    fields: ['goal_achieved', 'monthly_record', 'motivational_message'],
  },
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function isoOf(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function periodForType(period: ReportTypeCard['defaultPeriod']): {
  start: string;
  end: string;
} {
  const today = new Date();
  switch (period) {
    case 'today':
      return { start: isoOf(today), end: isoOf(today) };
    case 'thisWeek': {
      const dayIdx = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((dayIdx + 6) % 7));
      return { start: isoOf(monday), end: isoOf(today) };
    }
    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: isoOf(start), end: isoOf(today) };
    }
    case 'last7': {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { start: isoOf(start), end: isoOf(today) };
    }
    case 'last30': {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      return { start: isoOf(start), end: isoOf(today) };
    }
  }
}

function isFieldBlocked(key: FieldKey, prefs: PrefsLite): boolean {
  if (key === 'revenue' && prefs.never_show_revenue) return true;
  if (key === 'profit' && prefs.never_show_profit) return true;
  if (key === 'expenses' && prefs.never_show_expenses) return true;
  if (
    key === 'profit_margin' &&
    (prefs.never_show_revenue || prefs.never_show_profit)
  ) {
    return true;
  }
  return false;
}

export function SharingFlow({
  initialData,
  preferences,
  initialReportType,
  initialAchievementLabel,
}: Props) {
  // Se chegou com tipo pré-selecionado (ex: vindo de "Compartilhar conquista"),
  // pula direto pro step de configuração com defaults daquele tipo.
  const presetCard = initialReportType
    ? TYPE_CARDS.find((c) => c.key === initialReportType)
    : null;
  const [step, setStep] = useState<'pick' | 'config'>(presetCard ? 'config' : 'pick');
  const [reportType, setReportType] = useState<ReportType>(
    presetCard?.key ?? 'daily',
  );
  const [period, setPeriod] = useState(
    periodForType(presetCard?.defaultPeriod ?? 'today'),
  );
  const [fields, setFields] = useState<FieldKey[]>(() => {
    if (!presetCard) return [];
    return presetCard.defaultFields.filter((f) => !isFieldBlocked(f, preferences));
  });
  const [watermark, setWatermark] = useState(preferences.watermark_enabled);
  const [pending, startTransition] = useTransition();
  const [resultOpen, setResultOpen] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const brandColor = preferences.custom_brand_color || DEFAULT_BRAND;

  function handlePickType(card: ReportTypeCard) {
    setReportType(card.key);
    setPeriod(periodForType(card.defaultPeriod));
    // Filtra defaults que estão bloqueados por privacy
    const seeds = card.defaultFields.filter((f) => !isFieldBlocked(f, preferences));
    setFields(seeds);
    setStep('config');
  }

  function toggleField(key: FieldKey) {
    if (isFieldBlocked(key, preferences)) {
      toast.error('Campo bloqueado em Configurações → Privacidade.');
      return;
    }
    setFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  const dataForPreview = useMemo(() => initialData, [initialData]);

  function handleGenerate() {
    if (fields.length === 0) {
      toast.error('Selecione pelo menos um campo.');
      return;
    }
    startTransition(async () => {
      const r = await generateShareableReport({
        report_type: reportType,
        period_start: period.start,
        period_end: period.end,
        fields,
        watermark,
        brand_color: brandColor,
        achievement_label: initialAchievementLabel,
      });
      if (r.success) {
        setResultId(r.data.id);
        setResultUrl(r.data.imageUrl);
        setResultOpen(true);
        toast.success('Resumo gerado.');
      } else {
        toast.error(r.error);
      }
    });
  }

  if (step === 'pick') {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TYPE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => handlePickType(card)}
              className="text-left"
            >
              <Card
                variant="premium"
                className="bg-card border-0 ring-1 ring-[var(--border)] transition-all hover:shadow-lg hover:ring-[var(--gold)]/50"
              >
                <CardContent className="flex flex-col gap-3 px-6 py-6">
                  <div className="flex size-12 items-center justify-center rounded-full bg-[var(--gold)]/10">
                    <Icon className="size-6 text-[var(--gold)]" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="font-serif text-lg font-medium text-foreground">
                      {card.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setStep('pick')}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground hover:text-[var(--gold)]"
      >
        <ArrowLeft className="size-3.5" />
        Trocar tipo
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Configurações */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 rounded-xl border border-cream-dark bg-card p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">Início</Label>
                <Input
                  type="date"
                  value={period.start}
                  onChange={(e) =>
                    setPeriod((p) => ({ ...p, start: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs uppercase tracking-[0.16em]">Fim</Label>
                <Input
                  type="date"
                  value={period.end}
                  onChange={(e) => setPeriod((p) => ({ ...p, end: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {FIELD_GROUPS.map((group) => (
            <div
              key={group.key}
              className="flex flex-col gap-3 rounded-xl border border-cream-dark bg-card p-5"
            >
              <div className="flex flex-col gap-1">
                <p className="font-serif text-base font-medium text-foreground">
                  {group.emoji} {group.label}
                </p>
                {group.hint ? (
                  <p className="text-[10px] uppercase tracking-[0.14em] text-amber-700">
                    {group.hint}
                  </p>
                ) : null}
              </div>
              <ul className="flex flex-col gap-1">
                {group.fields.map((key) => {
                  const blocked = isFieldBlocked(key, preferences);
                  const checked = fields.includes(key);
                  return (
                    <li key={key}>
                      <label
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors',
                          blocked
                            ? 'cursor-not-allowed bg-muted/40 opacity-60'
                            : 'hover:bg-cream-dark/30',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleField(key)}
                          disabled={blocked}
                          className="size-4 cursor-pointer accent-[var(--gold)] disabled:cursor-not-allowed"
                        />
                        <span
                          className={cn(
                            'flex-1 text-sm',
                            blocked ? 'text-muted-foreground line-through' : 'text-foreground',
                          )}
                        >
                          {FIELD_LABELS[key]}
                        </span>
                        {blocked ? (
                          <Badge
                            variant="outline"
                            className="border-amber-300 bg-amber-50 text-[10px] text-amber-800"
                          >
                            Bloqueado
                          </Badge>
                        ) : null}
                        {FINANCIAL_FIELDS.includes(key) && !blocked ? (
                          <Badge
                            variant="outline"
                            className="border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[10px] text-foreground"
                          >
                            Financeiro
                          </Badge>
                        ) : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>

        {/* Preview lateral */}
        <aside className="flex flex-col gap-3 lg:sticky lg:top-4 lg:h-fit">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Preview ao vivo · 9:16
          </p>
          <ReportPreview
            reportType={reportType}
            periodStart={period.start}
            periodEnd={period.end}
            fields={fields}
            data={dataForPreview}
            watermark={watermark}
            brandColor={brandColor}
          />
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-cream-dark bg-card px-3 py-2.5">
            <Switch
              checked={watermark}
              onCheckedChange={(v) => setWatermark(Boolean(v))}
            />
            <span className="text-sm font-medium text-foreground">
              Marca d&apos;água Traço
            </span>
          </label>
          <Button
            variant="premium"
            size="xl"
            className="w-full"
            onClick={handleGenerate}
            disabled={pending || fields.length === 0}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Gerar imagem
          </Button>
        </aside>
      </div>

      <ReportResultDialog
        open={resultOpen}
        onOpenChange={setResultOpen}
        reportId={resultId}
        imageUrl={resultUrl}
      />
    </>
  );
}
