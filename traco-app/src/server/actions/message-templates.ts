'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentProfile } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/server';
import {
  messageTemplateSchema,
  type MessageTemplateCategory,
  type MessageTemplateInput,
} from '@/lib/validations/message-template';

type SimpleResult = { success: true } | { success: false; error: string };
type CreateResult =
  | { success: true; data: { id: string } }
  | { success: false; error: string };

function flattenZodErrors(error: import('zod').ZodError): string {
  return error.issues.map((i) => i.message).join(' ');
}

export async function createMessageTemplate(
  input: MessageTemplateInput,
): Promise<CreateResult> {
  const parsed = messageTemplateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: flattenZodErrors(parsed.error) };

  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();

  if (parsed.data.is_default) {
    await supabase
      .from('message_templates')
      .update({ is_default: false })
      .eq('tenant_id', profile.tenantId)
      .eq('category', parsed.data.category)
      .eq('is_default', true);
  }

  const { data, error } = await supabase
    .from('message_templates')
    .insert({
      tenant_id: profile.tenantId,
      name: parsed.data.name,
      category: parsed.data.category,
      body: parsed.data.body,
      is_default: parsed.data.is_default ?? false,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Erro ao criar template.' };
  }

  revalidatePath('/dashboard/configuracoes');
  return { success: true, data: { id: data.id } };
}

export async function updateMessageTemplate(
  id: string,
  input: MessageTemplateInput,
): Promise<SimpleResult> {
  const parsed = messageTemplateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: flattenZodErrors(parsed.error) };

  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();

  if (parsed.data.is_default) {
    await supabase
      .from('message_templates')
      .update({ is_default: false })
      .eq('tenant_id', profile.tenantId)
      .eq('category', parsed.data.category)
      .eq('is_default', true)
      .neq('id', id);
  }

  const { error } = await supabase
    .from('message_templates')
    .update({
      name: parsed.data.name,
      category: parsed.data.category,
      body: parsed.data.body,
      is_default: parsed.data.is_default ?? false,
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}

export async function deleteMessageTemplate(id: string): Promise<SimpleResult> {
  const supabase = await createClient();
  const { error } = await supabase.from('message_templates').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}

export async function setDefaultMessageTemplate(
  id: string,
  category: MessageTemplateCategory,
): Promise<SimpleResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { success: false, error: 'Sessão expirada.' };

  const supabase = await createClient();

  await supabase
    .from('message_templates')
    .update({ is_default: false })
    .eq('tenant_id', profile.tenantId)
    .eq('category', category)
    .eq('is_default', true);

  const { error } = await supabase
    .from('message_templates')
    .update({ is_default: true })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/configuracoes');
  return { success: true };
}
