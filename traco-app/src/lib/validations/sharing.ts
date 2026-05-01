import { z } from 'zod';

export const REPORT_TYPES = [
  'daily',
  'weekly',
  'monthly',
  'achievement',
  'goal_milestone',
  'custom',
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  daily: 'Resumo do dia',
  weekly: 'Resumo da semana',
  monthly: 'Resumo do mês',
  achievement: 'Conquista',
  goal_milestone: 'Marco de meta',
  custom: 'Personalizado',
};

export const SHARING_TEMPLATES = ['minimal', 'operational', 'full'] as const;
export type SharingTemplate = (typeof SHARING_TEMPLATES)[number];

export const SHARING_TEMPLATE_LABELS: Record<SharingTemplate, string> = {
  minimal: 'Minimal',
  operational: 'Operacional',
  full: 'Completo',
};

// Campos disponíveis no template — agrupados por categoria
export const FIELD_KEYS = [
  // Operacional
  'appointments_count',
  'hours_worked',
  'clients_count',
  'top_procedure',
  'highlight_client',
  // Financeiro (controlado por privacy flags)
  'revenue',
  'profit',
  'expenses',
  'profit_margin',
  // Conquistas/metas
  'goal_achieved',
  'monthly_record',
  'motivational_message',
] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];

export const FIELD_LABELS: Record<FieldKey, string> = {
  appointments_count: 'Atendimentos realizados',
  hours_worked: 'Horas trabalhadas',
  clients_count: 'Clientes atendidas',
  top_procedure: 'Procedimento mais feito',
  highlight_client: 'Cliente destaque',
  revenue: 'Receita',
  profit: 'Lucro',
  expenses: 'Despesas',
  profit_margin: 'Margem de lucro',
  goal_achieved: 'Meta atingida',
  monthly_record: 'Mês recorde',
  motivational_message: 'Mensagem motivacional',
};

export const FINANCIAL_FIELDS: FieldKey[] = [
  'revenue',
  'profit',
  'expenses',
  'profit_margin',
];

export const sharingPreferencesSchema = z.object({
  never_show_revenue: z.boolean(),
  never_show_profit: z.boolean(),
  never_show_expenses: z.boolean(),
  default_template: z.enum(SHARING_TEMPLATES),
  watermark_enabled: z.boolean(),
  custom_brand_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida.')
    .nullable()
    .optional()
    .or(z.literal('')),
});

export type SharingPreferencesInput = z.input<typeof sharingPreferencesSchema>;

export const generateReportSchema = z.object({
  report_type: z.enum(REPORT_TYPES),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fields: z.array(z.enum(FIELD_KEYS)).min(1, 'Escolha pelo menos um campo.'),
  watermark: z.boolean(),
  brand_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  achievement_label: z.string().trim().max(80).optional(),
});

export type GenerateReportInput = z.input<typeof generateReportSchema>;
