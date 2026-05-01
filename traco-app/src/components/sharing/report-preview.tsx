'use client';

import { formatCurrency } from '@/lib/format';
import type { ReportData } from '@/lib/queries/sharing';
import {
  REPORT_TYPE_LABELS,
  type FieldKey,
  type ReportType,
} from '@/lib/validations/sharing';
import { cn } from '@/lib/utils';

type FieldEntry = {
  key: FieldKey;
  label: string;
  value: string;
  emphasis: boolean;
};

function formatHours(total: number): string {
  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

function formatPeriodLabel(start: string, end: string): string {
  const fmt = (iso: string) => {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
  };
  return start === end ? fmt(start) : `${fmt(start)} – ${fmt(end)}`;
}

function buildEntries(
  fields: FieldKey[],
  data: ReportData,
  achievementLabel: string | undefined,
): FieldEntry[] {
  const list: FieldEntry[] = [];
  for (const key of fields) {
    switch (key) {
      case 'appointments_count':
        list.push({
          key,
          label: 'Atendimentos',
          value: String(data.appointmentsCount),
          emphasis: false,
        });
        break;
      case 'hours_worked':
        list.push({
          key,
          label: 'Horas trabalhadas',
          value: formatHours(data.hoursWorked),
          emphasis: false,
        });
        break;
      case 'clients_count':
        list.push({
          key,
          label: 'Clientes atendidas',
          value: String(data.clientsCount),
          emphasis: false,
        });
        break;
      case 'top_procedure':
        if (data.topProcedure) {
          list.push({
            key,
            label: 'Procedimento mais feito',
            value: data.topProcedure.name,
            emphasis: false,
          });
        }
        break;
      case 'highlight_client':
        if (data.highlightClient) {
          list.push({
            key,
            label: 'Cliente destaque',
            value: `${data.highlightClient.name} · ${data.highlightClient.visitsCount}ª visita`,
            emphasis: false,
          });
        }
        break;
      case 'revenue':
        list.push({
          key,
          label: 'Receita',
          value: formatCurrency(data.revenue),
          emphasis: false,
        });
        break;
      case 'profit':
        list.push({
          key,
          label: 'Lucro',
          value: formatCurrency(data.profit),
          emphasis: false,
        });
        break;
      case 'expenses':
        list.push({
          key,
          label: 'Despesas',
          value: formatCurrency(data.expenses),
          emphasis: false,
        });
        break;
      case 'profit_margin':
        list.push({
          key,
          label: 'Margem',
          value: data.revenue > 0 ? `${data.profitMargin.toFixed(0)}%` : '—',
          emphasis: false,
        });
        break;
      case 'goal_achieved':
        list.push({
          key,
          label: '✨ Meta atingida',
          value: achievementLabel ?? 'Bati minha meta esse mês 🎯',
          emphasis: true,
        });
        break;
      case 'monthly_record':
        list.push({
          key,
          label: '📈 Recorde',
          value: 'Mês recorde no studio',
          emphasis: true,
        });
        break;
      case 'motivational_message':
        list.push({
          key,
          label: '🚀',
          value: 'Pra cima!',
          emphasis: true,
        });
        break;
    }
  }
  return list;
}

type Props = {
  reportType: ReportType;
  periodStart: string;
  periodEnd: string;
  fields: FieldKey[];
  data: ReportData;
  watermark: boolean;
  brandColor: string;
  achievementLabel?: string;
};

export function ReportPreview({
  reportType,
  periodStart,
  periodEnd,
  fields,
  data,
  watermark,
  brandColor,
  achievementLabel,
}: Props) {
  const entries = buildEntries(fields, data, achievementLabel);
  const numbered = entries.filter((e) => !e.emphasis);
  const emphasized = entries.filter((e) => e.emphasis);
  const useGrid = numbered.length >= 3 && numbered.length <= 4;
  const useList = numbered.length >= 5;
  const useFocus = numbered.length >= 1 && numbered.length <= 2;

  return (
    <div
      className="relative flex w-full flex-col overflow-hidden rounded-xl px-7 py-12 text-cream shadow-2xl"
      style={{ aspectRatio: '9 / 16', backgroundColor: '#0A0A0A' }}
    >
      {/* Top */}
      <div className="flex flex-col items-start">
        <div
          className="mb-3 h-[2px] w-10"
          style={{ backgroundColor: brandColor }}
        />
        <p
          className="text-[10px] font-medium uppercase tracking-[0.2em] text-cream/60"
        >
          {REPORT_TYPE_LABELS[reportType]}
        </p>
        <p className="mt-1 text-[10px] text-cream/50">
          {formatPeriodLabel(periodStart, periodEnd)}
        </p>
      </div>

      {/* Emphasized */}
      {emphasized.length > 0 ? (
        <div className="mt-6 flex flex-col gap-2">
          {emphasized.map((e) => (
            <div
              key={e.key}
              className="flex flex-col gap-1.5 rounded-xl border-2 px-4 py-3"
              style={{
                borderColor: brandColor,
                backgroundColor: `${brandColor}1F`,
              }}
            >
              <p
                className="text-[10px] font-medium"
                style={{ color: brandColor }}
              >
                {e.label}
              </p>
              <p className="font-serif text-base font-semibold leading-tight text-cream">
                {e.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Numbered */}
      <div className="mt-6 flex flex-1 flex-col">
        {useFocus && numbered.length > 0 ? (
          <div className="flex flex-col gap-8">
            {numbered.map((e) => (
              <div key={e.key} className="flex flex-col gap-1">
                <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-cream/60">
                  {e.label}
                </p>
                <p
                  className="font-serif text-5xl font-bold leading-none tracking-tight"
                  style={{ color: brandColor }}
                >
                  {e.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {useGrid ? (
          <div className="grid grid-cols-2 gap-2">
            {numbered.map((e) => (
              <div
                key={e.key}
                className="flex flex-col gap-1 rounded-xl border px-3 py-3"
                style={{
                  borderColor: `${brandColor}40`,
                  backgroundColor: 'rgba(245,241,234,0.05)',
                }}
              >
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-cream/60">
                  {e.label}
                </p>
                <p
                  className="font-serif text-2xl font-bold leading-tight tracking-tight"
                  style={{ color: brandColor }}
                >
                  {e.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {useList ? (
          <div className="flex flex-col gap-2">
            {numbered.map((e) => (
              <div
                key={e.key}
                className="flex items-baseline justify-between gap-2 border-b pb-2"
                style={{ borderColor: `${brandColor}33` }}
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-cream/70">
                  {e.label}
                </p>
                <p
                  className="font-serif text-xl font-bold tracking-tight"
                  style={{ color: brandColor }}
                >
                  {e.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Watermark */}
      {watermark ? (
        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center">
          <p
            className="font-serif text-base font-light tracking-[0.18em]"
            style={{ color: brandColor }}
          >
            Traço
          </p>
          <p className="mt-0.5 text-[8px] uppercase tracking-[0.3em] text-cream/40">
            by Master Brow
          </p>
        </div>
      ) : null}

      {/* Empty state */}
      {entries.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="font-serif text-sm italic text-cream/50">
            Selecione campos pra ver o preview
          </p>
        </div>
      ) : null}

      {/* Aspecto guide */}
      <div
        className={cn('pointer-events-none absolute inset-0')}
        aria-hidden
      />
    </div>
  );
}
