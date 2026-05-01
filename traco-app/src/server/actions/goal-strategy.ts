'use server';

import Anthropic from '@anthropic-ai/sdk';
import { revalidatePath } from 'next/cache';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';

type Result =
  | { success: true; data: { strategy: string; cached: boolean; generatedAt: string } }
  | { success: false; error: string };

const CACHE_TTL_HOURS = 24;
const MODEL_ID = 'claude-haiku-4-5-20251001';

function isCacheFresh(generatedAt: string | null): boolean {
  if (!generatedAt) return false;
  const ageMs = Date.now() - new Date(generatedAt).getTime();
  return ageMs < CACHE_TTL_HOURS * 60 * 60 * 1000;
}

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export async function generateGoalStrategy(goalId: string): Promise<Result> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      success: false,
      error:
        'ANTHROPIC_API_KEY não configurada — peça ao admin para adicionar nas variáveis da Vercel.',
    };
  }

  const supabase = await createClient();
  const { data: goal } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .maybeSingle();
  if (!goal) return { success: false, error: 'Meta não encontrada.' };

  // Cache: 1 análise por dia por meta
  if (isCacheFresh(goal.ai_strategy_generated_at) && goal.ai_strategy_text) {
    return {
      success: true,
      data: {
        strategy: goal.ai_strategy_text,
        cached: true,
        generatedAt: goal.ai_strategy_generated_at as string,
      },
    };
  }

  // Coleta dados de contexto
  const target = Number(goal.target_value ?? 0);
  const current = Number(goal.current_value ?? 0);
  const gap = Math.max(0, target - current);
  const today = new Date();
  const endDate = new Date(`${goal.end_date}T23:59:59`);
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  );

  // Ticket médio dos últimos 90 dias
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const { data: recentAppts } = await supabase
    .from('appointments')
    .select('price')
    .eq('status', 'completed')
    .gte('performed_at', since.toISOString());
  const completedCount = recentAppts?.length ?? 0;
  const totalRevenue = (recentAppts ?? []).reduce(
    (s, r) => s + Number((r as { price?: number }).price ?? 0),
    0,
  );
  const avgTicket = completedCount > 0 ? totalRevenue / completedCount : 0;

  // Clientes em zona de perda (return_due_date passou)
  const todayIso = today.toISOString().slice(0, 10);
  const { data: overdueAppts } = await supabase
    .from('appointments')
    .select('client_id, return_due_date, price, procedures(default_price)')
    .lt('return_due_date', todayIso)
    .order('return_due_date', { ascending: false });

  type Raw = {
    client_id: string;
    return_due_date: string | null;
    price: number | null;
    procedures: { default_price?: number } | { default_price?: number }[] | null;
  };
  const seen = new Set<string>();
  const overdue: Array<{ value: number }> = [];
  for (const raw of overdueAppts ?? []) {
    const r = raw as unknown as Raw;
    if (!r.return_due_date) continue;
    if (seen.has(r.client_id)) continue;
    seen.add(r.client_id);
    const proc = Array.isArray(r.procedures) ? r.procedures[0] : r.procedures;
    overdue.push({
      value: Number(proc?.default_price ?? r.price ?? 0),
    });
  }
  const recoveryCount = overdue.length;
  const recoveryValue = overdue.reduce((s, o) => s + o.value, 0);

  const goalLabel =
    goal.type === 'revenue'
      ? `${BRL.format(target)} de faturamento`
      : goal.type === 'appointments'
        ? `${target} atendimentos`
        : goal.type === 'new_clients'
          ? `${target} novas clientes`
          : goal.type === 'recovered_clients'
            ? `${target} clientes recuperadas`
            : `${target} (meta personalizada: ${goal.title})`;

  const currentLabel =
    goal.type === 'revenue' ? BRL.format(current) : String(current);
  const gapLabel = goal.type === 'revenue' ? BRL.format(gap) : String(gap);

  const systemPrompt = [
    'Você é uma consultora de negócios pra designer de brow.',
    'Sua aluna tem uma meta. Analise os dados e dê 3 sugestões PRÁTICAS e ESPECÍFICAS pra ela atingir.',
    'Tom: amiga + mentora. Em português brasileiro, calor humano, mas direto.',
    'Use os dados reais que receber. Não invente números. Não use jargão de Marketing.',
    'Formato: numere as 3 sugestões. Cada uma com: ação clara, resultado esperado em R$, tempo estimado pra executar.',
    'Limite total: 250 palavras.',
  ].join(' ');

  const userPrompt = [
    `Meta: ${goal.title} (${goalLabel})`,
    `Período: ${goal.start_date} até ${goal.end_date}`,
    `Atual: ${currentLabel}`,
    `Faltam: ${gapLabel}`,
    `Dias restantes: ${daysRemaining}`,
    `Ticket médio dos últimos 90 dias: ${BRL.format(avgTicket)}`,
    `Atendimentos completados (90 dias): ${completedCount}`,
    `Clientes em zona de perda (com retorno vencido): ${recoveryCount}`,
    `Receita potencial recuperável: ${BRL.format(recoveryValue)}`,
    '',
    'Dê 3 sugestões específicas em ordem de prioridade.',
  ].join('\n');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let strategyText = '';
  try {
    const response = await client.messages.create({
      model: MODEL_ID,
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    for (const block of response.content) {
      if (block.type === 'text') strategyText += block.text;
    }
    strategyText = strategyText.trim();
  } catch (err) {
    console.error('[goal-strategy] Anthropic API error:', err);
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Falha ao gerar estratégia. Tente novamente.',
    };
  }

  if (!strategyText) {
    return { success: false, error: 'Resposta vazia da IA.' };
  }

  const generatedAt = new Date().toISOString();
  await supabase
    .from('goals')
    .update({
      ai_strategy_text: strategyText,
      ai_strategy_generated_at: generatedAt,
    })
    .eq('id', goalId);

  revalidatePath('/dashboard/metas');
  return {
    success: true,
    data: { strategy: strategyText, cached: false, generatedAt },
  };
}
