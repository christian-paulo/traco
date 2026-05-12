import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { MessageTemplateCategory } from '@/lib/validations/message-template';

export type MessageTemplateRow = {
  id: string;
  tenant_id: string;
  name: string;
  category: MessageTemplateCategory;
  body: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export async function listMessageTemplates(): Promise<MessageTemplateRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('message_templates')
    .select('*')
    .order('category', { ascending: true })
    .order('is_default', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  return (data ?? []) as MessageTemplateRow[];
}

export async function listMessageTemplatesByCategory(
  category: MessageTemplateCategory,
): Promise<MessageTemplateRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('message_templates')
    .select('*')
    .eq('category', category)
    .order('is_default', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  return (data ?? []) as MessageTemplateRow[];
}

export async function getDefaultMessageTemplate(
  category: MessageTemplateCategory,
): Promise<MessageTemplateRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('message_templates')
    .select('*')
    .eq('category', category)
    .eq('is_default', true)
    .maybeSingle();
  return (data as MessageTemplateRow | null) ?? null;
}
