import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type AnamnesisField = {
  id: string;
  type: 'text' | 'textarea' | 'date' | 'boolean' | 'select';
  label: string;
  options?: string[];
  required?: boolean;
};

export type AnamnesisFormRow = {
  id: string;
  client_id: string;
  template_id: string;
  status: 'pending' | 'signed' | 'expired';
  public_token: string | null;
  answers: Record<string, unknown> | null;
  signature_png: string | null;
  signed_at: string | null;
  signer_ip: string | null;
  integrity_hash: string | null;
  pdf_url: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export async function listAnamnesisFormsByClient(clientId: string): Promise<AnamnesisFormRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('anamnesis_forms')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AnamnesisFormRow[];
}

export async function getAnamnesisFormById(id: string): Promise<
  | (AnamnesisFormRow & {
      template: { id: string; name: string; fields: AnamnesisField[] };
    })
  | null
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('anamnesis_forms')
    .select('*, anamnesis_templates(id, name, fields)')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  const template = Array.isArray(data.anamnesis_templates)
    ? data.anamnesis_templates[0]
    : data.anamnesis_templates;
  if (!template) return null;
  return {
    ...(data as unknown as AnamnesisFormRow),
    template: template as { id: string; name: string; fields: AnamnesisField[] },
  };
}

export type PublicFichaPayload = {
  form: {
    id: string;
    client_id: string;
    template_id: string;
    public_token: string;
    status: 'pending' | 'signed' | 'expired';
    expires_at: string;
    signed_at: string | null;
    pdf_url: string | null;
  };
  client: { full_name: string; email: string | null };
  template: { id: string; name: string; fields: AnamnesisField[] };
  designer: { full_name: string };
};

/**
 * Lê uma ficha pública via token usando o admin client (bypass RLS).
 * Retorna null se não encontrada. NÃO valida expiração ou status — quem chama decide.
 */
export async function getPublicFichaByToken(token: string): Promise<PublicFichaPayload | null> {
  const supabase = createAdminClient();
  const { data: form, error } = await supabase
    .from('anamnesis_forms')
    .select('*')
    .eq('public_token', token)
    .maybeSingle();
  if (error || !form) return null;

  const [{ data: client }, { data: template }, { data: profile }] = await Promise.all([
    supabase.from('clients').select('full_name, email').eq('id', form.client_id).maybeSingle(),
    supabase
      .from('anamnesis_templates')
      .select('id, name, fields')
      .eq('id', form.template_id)
      .maybeSingle(),
    supabase.from('profiles').select('full_name').eq('tenant_id', form.tenant_id).maybeSingle(),
  ]);

  if (!client || !template) return null;

  return {
    form: {
      id: form.id,
      client_id: form.client_id,
      template_id: form.template_id,
      public_token: form.public_token as string,
      status: form.status as 'pending' | 'signed' | 'expired',
      expires_at: form.expires_at,
      signed_at: form.signed_at,
      pdf_url: form.pdf_url,
    },
    client: { full_name: client.full_name, email: client.email },
    template: template as { id: string; name: string; fields: AnamnesisField[] },
    designer: { full_name: profile?.full_name ?? 'sua designer' },
  };
}
