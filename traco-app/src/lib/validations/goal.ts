import { z } from 'zod';

export const GOAL_TYPES = [
  'revenue',
  'appointments',
  'new_clients',
  'recovered_clients',
  'custom',
] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

export const GOAL_PERIODS = ['week', 'month', 'quarter', 'year'] as const;
export type GoalPeriod = (typeof GOAL_PERIODS)[number];

export const GOAL_STATUSES = ['active', 'achieved', 'failed', 'cancelled'] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  revenue: 'Faturamento',
  appointments: 'Atendimentos',
  new_clients: 'Novas clientes',
  recovered_clients: 'Clientes recuperadas',
  custom: 'Meta personalizada',
};

export const GOAL_PERIOD_LABELS: Record<GoalPeriod, string> = {
  week: 'Semana',
  month: 'Mês',
  quarter: 'Trimestre',
  year: 'Ano',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'Em andamento',
  achieved: 'Atingida',
  failed: 'Não atingida',
  cancelled: 'Cancelada',
};

export const goalSchema = z.object({
  type: z.enum(GOAL_TYPES),
  target_value: z.number().positive('Defina um alvo maior que zero.'),
  period_type: z.enum(GOAL_PERIODS),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inicial inválida.'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data final inválida.'),
  title: z.string().trim().min(3, 'Título obrigatório.').max(120),
  description: z.string().trim().max(500).nullable().optional(),
});

export type GoalInput = z.input<typeof goalSchema>;

export type AchievementType =
  | 'first_client'
  | 'tenth_client'
  | 'hundredth_client'
  | 'first_recovery'
  | 'streak_7'
  | 'streak_30'
  | 'monthly_record'
  | 'goal_25'
  | 'goal_50'
  | 'goal_75'
  | 'goal_100'
  | 'big_recovery'
  | 'first_month_pro';

export const ACHIEVEMENT_META: Record<
  AchievementType,
  { label: string; description: string; icon: string }
> = {
  first_client: {
    label: 'Primeira cliente',
    description: 'Cadastrou a primeira cliente do studio.',
    icon: '🌱',
  },
  tenth_client: {
    label: '10 clientes',
    description: 'Já são 10 clientes no Traço!',
    icon: '🌿',
  },
  hundredth_client: {
    label: 'Centena',
    description: '100 clientes — você é referência.',
    icon: '🏆',
  },
  first_recovery: {
    label: 'Primeira recuperação',
    description: 'Trouxe de volta uma cliente em zona de perda.',
    icon: '💛',
  },
  streak_7: {
    label: '7 dias seguidos',
    description: 'Atendeu todos os dias da semana.',
    icon: '🔥',
  },
  streak_30: {
    label: '30 dias seguidos',
    description: 'Um mês inteiro com atendimentos.',
    icon: '⚡',
  },
  monthly_record: {
    label: 'Recorde do mês',
    description: 'Maior receita mensal já registrada.',
    icon: '📈',
  },
  goal_25: { label: '25% da meta', description: 'Primeiro quarto cumprido.', icon: '🎯' },
  goal_50: { label: 'Metade da meta', description: 'Você está no meio do caminho.', icon: '🎯' },
  goal_75: { label: '75% da meta', description: 'Reta final.', icon: '🎯' },
  goal_100: { label: 'Meta atingida', description: 'Bateu! Comemora.', icon: '🏅' },
  big_recovery: {
    label: 'Resgate em massa',
    description: 'Recuperou 5+ clientes em 30 dias.',
    icon: '💎',
  },
  first_month_pro: {
    label: 'Primeiro mês profissional',
    description: 'Mês completo usando o Traço como prontuário.',
    icon: '✨',
  },
};
