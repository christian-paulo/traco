/**
 * Detector de avisos clínicos críticos a partir das answers da ficha.
 * Retorna lista de avisos pra mostrar no header do Modo Atendimento.
 */

export type CriticalAlert = {
  level: 'high' | 'medium';
  text: string;
};

type Answer = unknown;

function isYes(v: Answer): boolean {
  if (v === true || v === 'true' || v === 'sim' || v === 'Sim') return true;
  if (typeof v === 'object' && v !== null) {
    const o = v as { value?: unknown };
    return o.value === true;
  }
  return false;
}

function getText(v: Answer): string | null {
  if (typeof v === 'object' && v !== null) {
    const o = v as { text?: string };
    return o.text?.trim() ? o.text : null;
  }
  return null;
}

export function detectCriticalAlerts(
  answers: Record<string, unknown> | null | undefined,
): CriticalAlert[] {
  if (!answers) return [];
  const alerts: CriticalAlert[] = [];

  if (isYes(answers.f_gestante)) {
    alerts.push({ level: 'high', text: 'Gestante — evitar contato com pigmentos e ácidos' });
  }
  if (isYes(answers.f_amamentando)) {
    alerts.push({ level: 'medium', text: 'Amamentando' });
  }
  if (isYes(answers.f_acidos)) {
    const detail = getText(answers.f_acidos);
    alerts.push({
      level: 'high',
      text: detail ? `Faz uso de ${detail}` : 'Faz uso de ácido / Roacutan / peeling',
    });
  }
  if (isYes(answers.f_doenca_dermato)) {
    const detail = getText(answers.f_doenca_dermato);
    alerts.push({
      level: 'high',
      text: detail ? `Doença dermatológica: ${detail}` : 'Histórico de doença dermatológica',
    });
  }
  if (isYes(answers.f_alergia_cosmetico)) {
    const detail = getText(answers.f_alergia_cosmetico);
    alerts.push({
      level: 'high',
      text: detail ? `Alergia: ${detail}` : 'Alergia cosmética conhecida',
    });
  }
  if (isYes(answers.f_dermatite)) {
    alerts.push({ level: 'medium', text: 'Dermatite ativa' });
  }
  if (isYes(answers.f_laser_sobrancelha)) {
    alerts.push({ level: 'medium', text: 'Em despigmentação a laser na sobrancelha' });
  }
  if (isYes(answers.f_tinta_cabelo)) {
    alerts.push({ level: 'medium', text: 'Usa tinta de cabelo na sobrancelha' });
  }
  if (isYes(answers.f_queda_pelo)) {
    alerts.push({ level: 'medium', text: 'Possui queda de pelo' });
  }

  return alerts;
}
