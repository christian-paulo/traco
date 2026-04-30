export const REACTION_TYPE_LABELS: Record<string, string> = {
  allergy: 'Alergia',
  irritation: 'Irritação',
  hypersensitivity: 'Hipersensibilidade',
  positive_excellent: 'Resultado excelente',
  below_expected: 'Resultado abaixo do esperado',
  other: 'Outro',
};

export const OCCURRED_WHEN_LABELS: Record<string, string> = {
  during: 'Durante o atendimento',
  immediately_after: 'Imediatamente após',
  '24_72h_after': '24-72h após',
  late_1week_plus: 'Tardia (+1 semana)',
};

export const REACTION_STATUS_LABELS: Record<string, string> = {
  active: 'Ativa',
  observation: 'Em observação',
  resolved: 'Resolvida',
};

export function reactionTypeLabel(value: string): string {
  return REACTION_TYPE_LABELS[value] ?? value;
}

export function occurredWhenLabel(value: string): string {
  return OCCURRED_WHEN_LABELS[value] ?? value;
}

export function reactionStatusLabel(value: string): string {
  return REACTION_STATUS_LABELS[value] ?? value;
}
