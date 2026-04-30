'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentProfile } from '@/lib/queries/profile';
import { getCurrentProfessional } from '@/lib/queries/studio';
import { createClient } from '@/lib/supabase/server';

type SeedResult =
  | {
      success: true;
      summary: { clients: number; appointments: number; reactions: number; notes: number };
    }
  | { success: false; error: string };

const TEST_TAG = 'seed-teste';

const TEST_CLIENTS = [
  { full_name: 'Beatriz Almeida (teste)', phone: '11999990001', email: 'bea@example.com' },
  { full_name: 'Camila Souza (teste)', phone: '11999990002', email: 'camila@example.com' },
  { full_name: 'Daniela Lima (teste)', phone: '11999990003', email: 'dani@example.com' },
  { full_name: 'Elisa Rocha (teste)', phone: '11999990004', email: 'elisa@example.com' },
  { full_name: 'Fernanda Tavares (teste)', phone: '11999990005', email: 'fer@example.com' },
];

export async function seedTestData(): Promise<SeedResult> {
  if (process.env.NODE_ENV !== 'development') {
    return { success: false, error: 'Seed disponível apenas em desenvolvimento.' };
  }

  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };
  const professional = await getCurrentProfessional();
  if (!professional) {
    return { success: false, error: 'Profissional não configurado.' };
  }

  const supabase = await createClient();

  // 1. Garantir um procedimento padrão pra usar
  const { data: anyProcedure } = await supabase
    .from('procedures')
    .select('id, default_price, default_return_days')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!anyProcedure) {
    return {
      success: false,
      error: 'Cadastre um procedimento antes de rodar o seed.',
    };
  }

  // 2. Template padrão de anamnese
  const { data: template } = await supabase
    .from('anamnesis_templates')
    .select('id, is_default')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Inserir clientes (skip duplicados via upsert por nome+phone)
  const insertedClients: Array<{ id: string; full_name: string; email: string | null }> = [];
  for (const c of TEST_CLIENTS) {
    const { data: existing } = await supabase
      .from('clients')
      .select('id, full_name, email')
      .eq('full_name', c.full_name)
      .maybeSingle();
    if (existing) {
      insertedClients.push({
        id: existing.id,
        full_name: existing.full_name,
        email: existing.email,
      });
      continue;
    }
    const { data: created, error } = await supabase
      .from('clients')
      .insert({
        tenant_id: profile.tenantId,
        full_name: c.full_name,
        phone: c.phone,
        email: c.email,
        tags: [TEST_TAG],
      })
      .select('id, full_name, email')
      .single();
    if (error || !created) continue;
    insertedClients.push({
      id: created.id,
      full_name: created.full_name,
      email: created.email,
    });
  }

  if (insertedClients.length === 0) {
    return { success: false, error: 'Falha ao criar clientes.' };
  }

  // 4. Para os 3 primeiros: ficha signed + 1 atendimento completed com procedure
  const today = new Date();
  let appointmentsCreated = 0;
  for (let i = 0; i < Math.min(3, insertedClients.length); i += 1) {
    const client = insertedClients[i];
    const performedAt = new Date(today);
    performedAt.setDate(today.getDate() - (i + 1) * 7);

    if (template) {
      const { data: form } = await supabase
        .from('anamnesis_forms')
        .insert({
          tenant_id: profile.tenantId,
          client_id: client.id,
          template_id: template.id,
          status: 'signed',
          answers: { f_nome_completo: client.full_name },
          signed_at: performedAt.toISOString(),
          integrity_hash: `seed-${client.id}`,
        })
        .select('id')
        .single();
      if (form) {
        await supabase.from('anamnesis_form_versions').insert({
          tenant_id: profile.tenantId,
          form_id: form.id,
          version_number: 1,
          is_original: true,
          answers: { f_nome_completo: client.full_name },
          signed_at: performedAt.toISOString(),
          integrity_hash: `seed-v1-${form.id}`,
        });
      }
    }

    const apptStart = new Date(performedAt);
    apptStart.setHours(10, 0, 0, 0);
    const apptEnd = new Date(apptStart);
    apptEnd.setMinutes(apptEnd.getMinutes() + 60);
    const { data: appt } = await supabase
      .from('appointments')
      .insert({
        tenant_id: profile.tenantId,
        professional_id: professional.id,
        client_id: client.id,
        procedure_id: anyProcedure.id,
        performed_at: apptStart.toISOString(),
        scheduled_start_at: apptStart.toISOString(),
        scheduled_end_at: apptEnd.toISOString(),
        status: 'completed',
        price: Number(anyProcedure.default_price ?? 0),
        source: 'manual',
      })
      .select('id')
      .single();

    if (appt) {
      appointmentsCreated += 1;
      await supabase.from('appointment_procedures').upsert(
        {
          tenant_id: profile.tenantId,
          appointment_id: appt.id,
          products_used: [
            { brand: 'Henna Brow', product: 'Castanho médio', step_time: 12 },
          ],
          step_times: [{ step_name: 'Henna - 1ª passagem', minutes: 12 }],
          technique: 'Lift + Henna',
          technical_notes: 'Cliente de teste — gerada por seed.',
        },
        { onConflict: 'appointment_id' },
      );
    }
  }

  // 5. 2 reações: 1 active (allergy) na cliente 0, 1 observation (irritation) na cliente 1
  let reactionsCreated = 0;
  if (insertedClients[0]) {
    const { error } = await supabase.from('client_reactions').insert({
      tenant_id: profile.tenantId,
      client_id: insertedClients[0].id,
      reaction_type: 'allergy',
      occurred_when: 'immediately_after',
      symptoms: 'Vermelhidão e coceira intensa após henna.',
      treatment: 'Compressa fria + anti-histamínico tópico.',
      status: 'active',
      photo_urls: [],
      created_by: profile.id,
    });
    if (!error) reactionsCreated += 1;
  }
  if (insertedClients[1]) {
    const { error } = await supabase.from('client_reactions').insert({
      tenant_id: profile.tenantId,
      client_id: insertedClients[1].id,
      reaction_type: 'irritation',
      occurred_when: 'during',
      symptoms: 'Leve ardência durante aplicação do lift.',
      treatment: 'Pausa de 5 min e neutralização imediata.',
      status: 'observation',
      photo_urls: [],
      created_by: profile.id,
    });
    if (!error) reactionsCreated += 1;
  }

  // 6. 4 notes: 2 pinned + 2 normais distribuídas
  let notesCreated = 0;
  const notesPlan = [
    { idx: 0, title: 'Pele sensível', content: 'Reagiu a henna comum — usar fórmula hipoalergênica.', pinned: true },
    { idx: 0, title: 'Preferência de medida', content: 'Gosta da medida 1.5 com curvatura suave.', pinned: false },
    { idx: 2, title: 'Cliente VIP', content: 'Reservar horário antes de 10h. Sempre traz café.', pinned: true },
    { idx: 3, title: 'Histórico de laser', content: 'Fez sessão de laser há 2 meses — atenção pigmento.', pinned: false },
  ];
  for (const plan of notesPlan) {
    const client = insertedClients[plan.idx];
    if (!client) continue;
    const { error } = await supabase.from('professional_notes').insert({
      tenant_id: profile.tenantId,
      client_id: client.id,
      title: plan.title,
      content: plan.content,
      pinned: plan.pinned,
      created_by: profile.id,
    });
    if (!error) notesCreated += 1;
  }

  // 7. 1 atendimento confirmed pra hoje (testar Modo Atendimento)
  if (insertedClients[4]) {
    const todayStart = new Date();
    todayStart.setHours(15, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setMinutes(todayEnd.getMinutes() + 60);

    // Evitar duplicar: checa se já existe um confirmed pra hoje desta cliente
    const isoToday = new Date(
      todayStart.getFullYear(),
      todayStart.getMonth(),
      todayStart.getDate(),
      0,
      0,
      0,
    ).toISOString();
    const isoEndToday = new Date(
      todayStart.getFullYear(),
      todayStart.getMonth(),
      todayStart.getDate(),
      23,
      59,
      59,
    ).toISOString();
    const { data: existingToday } = await supabase
      .from('appointments')
      .select('id')
      .eq('client_id', insertedClients[4].id)
      .gte('scheduled_start_at', isoToday)
      .lte('scheduled_start_at', isoEndToday)
      .maybeSingle();
    if (!existingToday) {
      await supabase.from('appointments').insert({
        tenant_id: profile.tenantId,
        professional_id: professional.id,
        client_id: insertedClients[4].id,
        procedure_id: anyProcedure.id,
        performed_at: todayStart.toISOString(),
        scheduled_start_at: todayStart.toISOString(),
        scheduled_end_at: todayEnd.toISOString(),
        status: 'confirmed',
        price: Number(anyProcedure.default_price ?? 0),
        source: 'manual',
      });
      appointmentsCreated += 1;
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/clientes');
  revalidatePath('/dashboard/agenda');
  return {
    success: true,
    summary: {
      clients: insertedClients.length,
      appointments: appointmentsCreated,
      reactions: reactionsCreated,
      notes: notesCreated,
    },
  };
}
