import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';

import { getReportData } from '@/lib/queries/sharing';
import {
  FIELD_LABELS,
  generateReportSchema,
  REPORT_TYPE_LABELS,
  type FieldKey,
} from '@/lib/validations/sharing';

export const runtime = 'nodejs';

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatDateBR(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function formatPeriodLabel(start: string, end: string): string {
  return start === end
    ? formatDateBR(start)
    : `${formatDateBR(start)} – ${formatDateBR(end)}`;
}

type FieldEntry = {
  key: FieldKey;
  label: string;
  value: string;
  emphasis?: boolean;
};

function buildEntries(
  fields: FieldKey[],
  data: Awaited<ReturnType<typeof getReportData>>,
  achievementLabel: string | undefined,
): FieldEntry[] {
  const entries: FieldEntry[] = [];

  for (const key of fields) {
    switch (key) {
      case 'appointments_count':
        entries.push({
          key,
          label: FIELD_LABELS.appointments_count,
          value: String(data.appointmentsCount),
        });
        break;
      case 'hours_worked': {
        const total = data.hoursWorked;
        const h = Math.floor(total);
        const m = Math.round((total - h) * 60);
        entries.push({
          key,
          label: FIELD_LABELS.hours_worked,
          value: m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`,
        });
        break;
      }
      case 'clients_count':
        entries.push({
          key,
          label: FIELD_LABELS.clients_count,
          value: String(data.clientsCount),
        });
        break;
      case 'top_procedure':
        if (data.topProcedure) {
          entries.push({
            key,
            label: FIELD_LABELS.top_procedure,
            value: data.topProcedure.name,
          });
        }
        break;
      case 'highlight_client':
        if (data.highlightClient) {
          entries.push({
            key,
            label: FIELD_LABELS.highlight_client,
            value: `${data.highlightClient.name} · ${data.highlightClient.visitsCount}ª visita`,
          });
        }
        break;
      case 'revenue':
        entries.push({
          key,
          label: FIELD_LABELS.revenue,
          value: BRL.format(data.revenue),
        });
        break;
      case 'profit':
        entries.push({
          key,
          label: FIELD_LABELS.profit,
          value: BRL.format(data.profit),
        });
        break;
      case 'expenses':
        entries.push({
          key,
          label: FIELD_LABELS.expenses,
          value: BRL.format(data.expenses),
        });
        break;
      case 'profit_margin':
        entries.push({
          key,
          label: FIELD_LABELS.profit_margin,
          value: data.revenue > 0 ? `${data.profitMargin.toFixed(0)}%` : '—',
        });
        break;
      case 'goal_achieved':
        entries.push({
          key,
          label: '✨ Meta atingida',
          value: achievementLabel ?? 'Bati minha meta esse mês 🎯',
          emphasis: true,
        });
        break;
      case 'monthly_record':
        entries.push({
          key,
          label: '📈 Recorde',
          value: 'Mês recorde no studio',
          emphasis: true,
        });
        break;
      case 'motivational_message':
        entries.push({
          key,
          label: '🚀',
          value: 'Pra cima!',
          emphasis: true,
        });
        break;
    }
  }
  return entries;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const parsed = generateReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 400 },
    );
  }
  const cfg = parsed.data;

  const data = await getReportData({
    periodStart: cfg.period_start,
    periodEnd: cfg.period_end,
  });

  const entries = buildEntries(cfg.fields, data, cfg.achievement_label);
  const periodLabel = formatPeriodLabel(cfg.period_start, cfg.period_end);
  const reportTypeLabel = REPORT_TYPE_LABELS[cfg.report_type];
  const accent = cfg.brand_color ?? '#C9A961';
  const bigCount = entries.filter((e) => !e.emphasis).length;
  const useGrid = bigCount >= 3 && bigCount <= 4;
  const useList = bigCount >= 5;
  const useFocus = bigCount <= 2;

  const emphasized = entries.filter((e) => e.emphasis);
  const numbered = entries.filter((e) => !e.emphasis);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1080px',
          height: '1920px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0A0A0A',
          color: '#F5F1EA',
          fontFamily: 'sans-serif',
          padding: '120px 80px',
          position: 'relative',
        }}
      >
        {/* Top brand */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              width: 60,
              height: 2,
              backgroundColor: accent,
              marginBottom: 20,
            }}
          />
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(245,241,234,0.6)',
              marginBottom: 8,
            }}
          >
            {reportTypeLabel}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              color: 'rgba(245,241,234,0.5)',
            }}
          >
            {periodLabel}
          </div>
        </div>

        {/* Conquista emphasis (destaque emocional) */}
        {emphasized.length > 0 ? (
          <div
            style={{
              marginTop: 80,
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            {emphasized.map((e) => (
              <div
                key={e.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '32px 40px',
                  borderRadius: 24,
                  border: `2px solid ${accent}`,
                  backgroundColor: 'rgba(201,169,97,0.08)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    fontSize: 36,
                    color: accent,
                    marginBottom: 12,
                  }}
                >
                  {e.label}
                </div>
                <div
                  style={{
                    display: 'flex',
                    fontSize: 56,
                    fontWeight: 600,
                    color: '#F5F1EA',
                    lineHeight: 1.1,
                  }}
                >
                  {e.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Numbered fields — layout adapta pelo count */}
        <div
          style={{
            marginTop: 80,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'flex-start',
          }}
        >
          {useFocus && numbered.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 80,
                marginTop: 60,
              }}
            >
              {numbered.map((e) => (
                <div
                  key={e.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 32,
                      color: 'rgba(245,241,234,0.6)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginBottom: 16,
                    }}
                  >
                    {e.label}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 200,
                      fontWeight: 700,
                      color: accent,
                      lineHeight: 0.95,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {e.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {useGrid ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 32,
                marginTop: 40,
              }}
            >
              {numbered.map((e) => (
                <div
                  key={e.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: 'calc(50% - 16px)',
                    padding: '36px 32px',
                    borderRadius: 24,
                    backgroundColor: 'rgba(245,241,234,0.06)',
                    border: '1px solid rgba(201,169,97,0.25)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 26,
                      color: 'rgba(245,241,234,0.6)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginBottom: 12,
                    }}
                  >
                    {e.label}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 80,
                      fontWeight: 700,
                      color: accent,
                      lineHeight: 1,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {e.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {useList ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                marginTop: 40,
              }}
            >
              {numbered.map((e) => (
                <div
                  key={e.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    paddingBottom: 24,
                    borderBottom: '1px solid rgba(201,169,97,0.25)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 30,
                      color: 'rgba(245,241,234,0.7)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {e.label}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 56,
                      fontWeight: 700,
                      color: accent,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {e.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Watermark */}
        {cfg.watermark ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 60,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 32,
                color: accent,
                letterSpacing: '0.18em',
                fontWeight: 300,
              }}
            >
              Traço
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 18,
                color: 'rgba(245,241,234,0.4)',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                marginTop: 8,
              }}
            >
              by Master Brow
            </div>
          </div>
        ) : null}
      </div>
    ),
    {
      width: 1080,
      height: 1920,
    },
  );
}
