'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import {
  generateReportSchema,
  sharingPreferencesSchema,
  type GenerateReportInput,
  type SharingPreferencesInput,
} from '@/lib/validations/sharing';

type SimpleResult = { success: true } | { success: false; error: string };
type GenerateResult =
  | { success: true; data: { id: string; imageUrl: string } }
  | { success: false; error: string };

function flattenZodErrors(error: import('zod').ZodError): string {
  return error.issues.map((i) => i.message).join(' ');
}

export async function updateSharingPreferences(
  input: SharingPreferencesInput,
): Promise<SimpleResult> {
  const parsed = sharingPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: flattenZodErrors(parsed.error) };
  }
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();
  const customColor =
    parsed.data.custom_brand_color && parsed.data.custom_brand_color.length > 0
      ? parsed.data.custom_brand_color
      : null;

  const { error } = await supabase
    .from('sharing_preferences')
    .upsert(
      {
        tenant_id: profile.tenantId,
        never_show_revenue: parsed.data.never_show_revenue,
        never_show_profit: parsed.data.never_show_profit,
        never_show_expenses: parsed.data.never_show_expenses,
        default_template: parsed.data.default_template,
        watermark_enabled: parsed.data.watermark_enabled,
        custom_brand_color: customColor,
      },
      { onConflict: 'tenant_id' },
    );
  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/configuracoes');
  revalidatePath('/dashboard/compartilhar');
  return { success: true };
}

/**
 * Inicia geração de relatório: valida payload, chama API route que renderiza
 * via next/og e faz upload pro Storage. Retorna URL pública.
 */
export async function generateShareableReport(
  input: GenerateReportInput,
): Promise<GenerateResult> {
  const parsed = generateReportSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: flattenZodErrors(parsed.error) };
  }
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';

  // Faz fetch do API route que renderiza a imagem
  let imageBuffer: ArrayBuffer;
  try {
    const url = new URL('/api/generate-report-image', baseUrl);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Erro na geração: ${text.slice(0, 200)}` };
    }
    imageBuffer = await res.arrayBuffer();
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao gerar imagem.',
    };
  }

  // Upload pro Storage público
  const supabase = await createClient();
  const path = `${profile.tenantId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
  const { error: uploadError } = await supabase.storage
    .from('shared-reports')
    .upload(path, new Uint8Array(imageBuffer), {
      contentType: 'image/png',
      upsert: false,
    });
  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: pub } = supabase.storage.from('shared-reports').getPublicUrl(path);
  const imageUrl = pub.publicUrl;

  // Registra entry em generated_reports
  const fieldsAsJson: Record<string, boolean> = {};
  for (const f of parsed.data.fields) fieldsAsJson[f] = true;

  const { data: created, error: insertError } = await supabase
    .from('generated_reports')
    .insert({
      tenant_id: profile.tenantId,
      report_type: parsed.data.report_type,
      period_start: parsed.data.period_start,
      period_end: parsed.data.period_end,
      included_fields: fieldsAsJson as never,
      storage_path: path,
      image_url: imageUrl,
      created_by: profile.id,
    })
    .select('id')
    .single();
  if (insertError || !created) {
    return { success: false, error: insertError?.message ?? 'Erro ao registrar.' };
  }

  revalidatePath('/dashboard/compartilhar');
  return { success: true, data: { id: created.id, imageUrl } };
}

export async function markReportShared(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('generated_reports')
    .update({ shared_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/compartilhar');
  return { success: true };
}

export async function deleteGeneratedReport(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from('generated_reports')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();
  if (row?.storage_path) {
    await supabase.storage.from('shared-reports').remove([row.storage_path]);
  }
  const { error } = await supabase.from('generated_reports').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/compartilhar');
  return { success: true };
}
