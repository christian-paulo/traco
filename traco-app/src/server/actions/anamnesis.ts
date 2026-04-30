'use server';

import { createHash } from 'node:crypto';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { generateAnamnesisPDF } from '@/lib/pdf/anamnesis-pdf';
import { getCurrentProfile } from '@/lib/queries/profile';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  sendAnamnesisCompletedClient,
  sendAnamnesisCompletedDesigner,
  sendAnamnesisInvite,
} from '@/lib/email';
import type { Json } from '@/types/database';

type SimpleResult = { success: true } | { success: false; error: string };
type CreateResult =
  | {
      success: true;
      data: { id: string; public_token: string; public_url: string; emailSent: boolean };
    }
  | { success: false; error: string };
type SubmitResult = { success: true; data: { id: string } } | { success: false; error: string };

const PDF_SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 ano

function getOrigin(headerList: Headers): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const host = headerList.get('host');
  if (host) {
    const proto = host.includes('localhost') ? 'http' : 'https';
    return `${proto}://${host}`;
  }
  return headerList.get('origin') ?? 'http://localhost:3000';
}

async function fetchTenantContext(tenantId: string) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  return {
    designerName: profile?.full_name ?? 'sua designer',
    designerEmail: profile?.email ?? null,
  };
}

export async function createAnamnesisLink(clientId: string): Promise<CreateResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();

  const { data: template, error: templateError } = await supabase
    .from('anamnesis_templates')
    .select('id')
    .eq('is_default', true)
    .maybeSingle();
  if (templateError || !template) {
    return { success: false, error: 'Nenhum template de anamnese encontrado.' };
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, full_name, email')
    .eq('id', clientId)
    .maybeSingle();
  if (clientError || !client) {
    return { success: false, error: 'Cliente não encontrada.' };
  }

  const { data: form, error: insertError } = await supabase
    .from('anamnesis_forms')
    .insert({
      tenant_id: profile.tenantId,
      client_id: client.id,
      template_id: template.id,
      status: 'pending',
    })
    .select('id, public_token')
    .single();

  if (insertError || !form?.public_token) {
    return {
      success: false,
      error: insertError?.message ?? 'Erro ao gerar ficha.',
    };
  }

  const headerList = await headers();
  const origin = getOrigin(headerList);
  const publicUrl = `${origin}/ficha/${form.public_token}`;

  let emailSent = false;
  if (client.email) {
    console.log('[Action] createAnamnesisLink → cliente tem email, enviando para:', client.email);
    const emailResult = await sendAnamnesisInvite({
      to: client.email,
      clientName: client.full_name,
      designerName: profile.fullName ?? 'sua designer',
      formUrl: publicUrl,
    });
    emailSent = emailResult.success;
    if (!emailResult.success) {
      console.error('[Action] createAnamnesisLink → falha no envio:', emailResult.error);
    }
  } else {
    console.log('[Action] createAnamnesisLink → cliente sem email, pulando envio');
  }

  revalidatePath(`/dashboard/clientes/${client.id}`);
  return {
    success: true,
    data: {
      id: form.id,
      public_token: form.public_token,
      public_url: publicUrl,
      emailSent,
    },
  };
}

export async function resendAnamnesisLink(formId: string): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();
  const { data: form } = await supabase
    .from('anamnesis_forms')
    .select('id, public_token, status, expires_at, clients(full_name, email)')
    .eq('id', formId)
    .maybeSingle();

  if (!form || !form.public_token) {
    return { success: false, error: 'Ficha não encontrada.' };
  }
  if (form.status !== 'pending') {
    return { success: false, error: 'Esta ficha não está mais pendente.' };
  }

  const client = Array.isArray(form.clients) ? form.clients[0] : form.clients;
  if (!client?.email) {
    return { success: false, error: 'Cliente não tem email cadastrado.' };
  }

  const headerList = await headers();
  const origin = getOrigin(headerList);
  const publicUrl = `${origin}/ficha/${form.public_token}`;

  console.log('[Action] resendAnamnesisLink → reenviando para:', client.email);
  const result = await sendAnamnesisInvite({
    to: client.email,
    clientName: client.full_name,
    designerName: profile.fullName ?? 'sua designer',
    formUrl: publicUrl,
  });
  if (!result.success) {
    console.error('[Action] resendAnamnesisLink → falha:', result.error);
    return { success: false, error: result.error };
  }

  return { success: true };
}

export async function deleteAnamnesisForm(formId: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('anamnesis_forms')
    .select('client_id')
    .eq('id', formId)
    .maybeSingle();

  const { error } = await supabase.from('anamnesis_forms').delete().eq('id', formId);
  if (error) return { success: false, error: error.message };

  if (existing?.client_id) {
    revalidatePath(`/dashboard/clientes/${existing.client_id}`);
  }
  return { success: true };
}

type SubmitInput = {
  token: string;
  answers: Record<string, unknown>;
  signature_png: string;
};

export async function submitAnamnesisForm(input: SubmitInput): Promise<SubmitResult> {
  if (!input.token || !input.signature_png) {
    return { success: false, error: 'Dados incompletos.' };
  }

  const admin = createAdminClient();

  const { data: form } = await admin
    .from('anamnesis_forms')
    .select('*')
    .eq('public_token', input.token)
    .maybeSingle();

  if (!form) {
    return { success: false, error: 'Ficha não encontrada.' };
  }
  if (form.status !== 'pending') {
    return { success: false, error: 'Esta ficha já foi assinada.' };
  }
  if (new Date(form.expires_at).getTime() < Date.now()) {
    return { success: false, error: 'Este link expirou.' };
  }

  const headerList = await headers();
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerList.get('x-real-ip') ??
    null;
  const signedAt = new Date().toISOString();
  const integrityHash = createHash('sha256')
    .update(
      JSON.stringify({
        answers: input.answers,
        signature_png: input.signature_png,
        signed_at: signedAt,
      }),
    )
    .digest('hex');

  // Cria versão 1 (original, IMUTÁVEL pelo trigger no banco)
  const { data: versionRow, error: versionError } = await admin
    .from('anamnesis_form_versions')
    .insert({
      tenant_id: form.tenant_id,
      form_id: form.id,
      version_number: 1,
      is_original: true,
      answers: input.answers as Json,
      signature_png: input.signature_png,
      signed_at: signedAt,
      signer_ip: ip,
      integrity_hash: integrityHash,
    })
    .select('id')
    .maybeSingle();

  // Se a tabela ainda não existe (migração 04 não aplicada), seguimos sem versão
  // pra não quebrar fluxo já em produção. Logamos pra ficar visível.
  if (versionError) {
    console.warn(
      '[submitAnamnesisForm] Falha ao gravar versão (migração 04 aplicada?):',
      versionError.message,
    );
  }

  // Atualiza form mantendo compatibilidade com colunas legadas + aponta versão atual
  const updatePayload: {
    status: string;
    answers: Json;
    signature_png: string;
    signed_at: string;
    signer_ip: string | null;
    integrity_hash: string;
    current_version_id?: string | null;
  } = {
    status: 'signed',
    answers: input.answers as Json,
    signature_png: input.signature_png,
    signed_at: signedAt,
    signer_ip: ip,
    integrity_hash: integrityHash,
  };
  if (versionRow?.id) {
    updatePayload.current_version_id = versionRow.id;
  }
  const { error: updateError } = await admin
    .from('anamnesis_forms')
    .update(updatePayload)
    .eq('id', form.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Busca dados completos para o PDF
  const [{ data: client }, { data: template }, { data: profile }] = await Promise.all([
    admin
      .from('clients')
      .select('full_name, phone, email, birth_date')
      .eq('id', form.client_id)
      .maybeSingle(),
    admin
      .from('anamnesis_templates')
      .select('name, fields')
      .eq('id', form.template_id)
      .maybeSingle(),
    admin.from('profiles').select('full_name, email').eq('tenant_id', form.tenant_id).maybeSingle(),
  ]);

  let pdfUrl: string | null = null;
  if (client && template) {
    try {
      const pdfBytes = await generateAnamnesisPDF({
        form: {
          id: form.id,
          answers: input.answers,
          signature_png: input.signature_png,
          signed_at: signedAt,
          signer_ip: ip,
          integrity_hash: integrityHash,
        },
        client: {
          full_name: client.full_name,
          phone: client.phone,
          email: client.email,
          birth_date: client.birth_date,
        },
        template: {
          name: template.name,
          fields: (template.fields ?? []) as Array<{
            id: string;
            type: 'text' | 'textarea' | 'date' | 'boolean' | 'select';
            label: string;
            options?: string[];
            required?: boolean;
          }>,
        },
        designerName: profile?.full_name ?? 'Designer',
      });

      const path = `${form.tenant_id}/${form.id}.pdf`;
      const { error: uploadError } = await admin.storage
        .from('anamnesis-pdfs')
        .upload(path, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (!uploadError) {
        const { data: signed } = await admin.storage
          .from('anamnesis-pdfs')
          .createSignedUrl(path, PDF_SIGNED_URL_TTL);
        pdfUrl = signed?.signedUrl ?? null;
        if (pdfUrl) {
          await admin.from('anamnesis_forms').update({ pdf_url: pdfUrl }).eq('id', form.id);
        }
      }
    } catch {
      // PDF é nice-to-have — não falha o submit se quebrar
    }
  }

  // Emails (não bloqueia se falhar — só loga)
  if (client?.email) {
    const r = await sendAnamnesisCompletedClient({
      to: client.email,
      clientName: client.full_name,
      pdfUrl: pdfUrl ?? undefined,
      designerName: profile?.full_name ?? 'sua designer',
    });
    if (!r.success) console.error('[Action] submit → email cliente falhou:', r.error);
  }
  if (profile?.email) {
    const criticalAnswers = collectCriticalAnswers(template?.fields, input.answers);
    const headerList2 = await headers();
    const origin = getOrigin(headerList2);
    const r = await sendAnamnesisCompletedDesigner({
      to: profile.email,
      clientName: client?.full_name ?? 'Cliente',
      designerName: profile.full_name ?? 'Designer',
      criticalAnswers,
      pdfUrl: pdfUrl ?? undefined,
      clientProfileUrl: `${origin}/dashboard/clientes/${form.client_id}`,
    });
    if (!r.success) console.error('[Action] submit → email designer falhou:', r.error);
  }

  revalidatePath(`/dashboard/clientes/${form.client_id}`);
  return { success: true, data: { id: form.id } };
}

function collectCriticalAnswers(
  fields: unknown,
  answers: Record<string, unknown>,
): Array<{ label: string; value: string }> {
  if (!Array.isArray(fields)) return [];
  const critical: Array<{ label: string; value: string }> = [];
  for (const field of fields) {
    const f = field as { id: string; type: string; label: string };
    const raw = answers[f.id];
    if (f.type === 'boolean') {
      if (raw === true || raw === 'true' || raw === 'sim' || raw === 'Sim') {
        critical.push({ label: f.label, value: 'Sim' });
      }
    }
  }
  return critical;
}

type EditVersionInput = {
  formId: string;
  answers: Record<string, unknown>;
  editReason: string;
};

type EditVersionResult =
  | { success: true; data: { versionId: string; versionNumber: number } }
  | { success: false; error: string };

export async function editFormVersion(input: EditVersionInput): Promise<EditVersionResult> {
  if (!input.formId) return { success: false, error: 'Formulário inválido.' };
  const reason = input.editReason.trim();
  if (reason.length < 3) {
    return { success: false, error: 'Informe o motivo da edição.' };
  }

  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();

  const { data: form, error: formError } = await supabase
    .from('anamnesis_forms')
    .select('id, tenant_id, client_id, edit_count')
    .eq('id', input.formId)
    .maybeSingle();
  if (formError || !form) {
    return { success: false, error: 'Ficha não encontrada.' };
  }

  // Maior versão atual
  const { data: latest } = await supabase
    .from('anamnesis_form_versions')
    .select('version_number')
    .eq('form_id', form.id)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = (latest?.version_number ?? 0) + 1;

  const editedAt = new Date().toISOString();
  const integrityHash = createHash('sha256')
    .update(
      JSON.stringify({
        answers: input.answers,
        edited_at: editedAt,
        edited_by: profile.id,
        edit_reason: reason,
      }),
    )
    .digest('hex');

  const { data: created, error: insertError } = await supabase
    .from('anamnesis_form_versions')
    .insert({
      tenant_id: form.tenant_id,
      form_id: form.id,
      version_number: nextVersion,
      is_original: false,
      answers: input.answers as Json,
      signature_png: null,
      signed_at: null,
      signer_ip: null,
      edited_by: profile.id,
      edit_reason: reason,
      integrity_hash: integrityHash,
    })
    .select('id, version_number')
    .single();

  if (insertError || !created) {
    return { success: false, error: insertError?.message ?? 'Erro ao salvar versão.' };
  }

  const { error: updateError } = await supabase
    .from('anamnesis_forms')
    .update({
      current_version_id: created.id,
      edit_count: (form.edit_count ?? 0) + 1,
      answers: input.answers as Json, // mantém compat com queries legadas
    })
    .eq('id', form.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath(`/dashboard/clientes/${form.client_id}`);
  return {
    success: true,
    data: { versionId: created.id, versionNumber: created.version_number },
  };
}
